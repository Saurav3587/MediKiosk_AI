import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

class MedicalRAGService:
    """Verified Medical RAG & Knowledge Base Service for MediKiosk.
    Grounds AI conversational triage on verified Indian clinical guidelines:
      - MoHFW Standard Treatment Guidelines (STGs)
      - Cardiological Society of India (CSI) Emergency Guidelines
      - NTEP Pulmonary Guidelines
      - Ministry of AYUSH Integrative Health Guidelines
    """

    def __init__(self):
        self.kb_path = Path(__file__).resolve().parent.parent / "data" / "medical_knowledge_base.json"
        self.protocols = []
        self.load_knowledge_base()

    def load_knowledge_base(self):
        try:
            if self.kb_path.exists():
                with open(self.kb_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.protocols = data.get("protocols", [])
            else:
                self.protocols = []
        except Exception as e:
            print(f"[MedicalRAGService] Error loading knowledge base: {e}")
            self.protocols = []

    def match_protocols(
        self,
        user_text: str,
        department: str = "",
        top_k: int = 2
    ) -> List[Dict[str, Any]]:
        """Matches patient chief complaints & symptom descriptions to verified clinical protocols."""
        if not self.protocols:
            return []

        text_lower = (user_text or "").lower()
        scored_protocols = []

        for p in self.protocols:
            score = 0
            matched_keywords = []

            # Check English keywords
            for kw in p.get("keywords_en", []):
                pattern = r"\b" + re.escape(kw.lower()) + r"\b"
                if re.search(pattern, text_lower):
                    score += 3
                    matched_keywords.append(kw)

            # Check Hindi/Hinglish keywords
            for kw in p.get("keywords_hi", []):
                if kw.lower() in text_lower:
                    score += 4
                    matched_keywords.append(kw)

            # Bonus score if assigned department matches
            if department:
                dept_lower = department.lower()
                pid = p.get("id", "")
                if "ayush" in dept_lower and "ayush" in pid:
                    score += 5
                elif "cardio" in dept_lower and "cardio" in pid:
                    score += 5
                elif "ortho" in dept_lower and "ortho" in pid:
                    score += 5
                elif "pedia" in dept_lower and "fever" in pid:
                    score += 3

            if score > 0:
                scored_protocols.append((score, matched_keywords, p))

        # Sort by score descending
        scored_protocols.sort(key=lambda x: x[0], reverse=True)

        if not scored_protocols:
            # Fallback to general acute infection / fever as default OPD presentation
            default_p = next((p for p in self.protocols if p.get("id") == "acute_fever_infection"), self.protocols[0])
            return [default_p]

        return [item[2] for item in scored_protocols[:top_k]]

    def build_grounded_rag_context(
        self,
        user_text: str,
        patient_name: str = "Patient",
        age: int = 35,
        gender: str = "Male",
        department: str = "General Medicine",
        turn_count: int = 1
    ) -> Tuple[str, Dict[str, Any]]:
        """Builds a verified medical RAG context block for LLM prompt injection."""
        matched = self.match_protocols(user_text, department=department, top_k=2)

        context_lines = [
            "================================================================================",
            "VERIFIED MEDICAL KNOWLEDGE BASE (INDIAN CLINICAL GUIDELINES / MOHFW GROUND TRUTH)",
            "================================================================================"
        ]

        primary_protocol = matched[0] if matched else None
        suggested_chips_hi = []
        red_flags_list = []
        guidelines_applied = []

        for idx, proto in enumerate(matched, 1):
            guidelines_applied.append(proto.get("title", ""))
            context_lines.append(f"\n[CLINICAL GUIDELINE {idx}: {proto.get('title')}]")
            context_lines.append(f"• Authority Source: {proto.get('guideline_source')}")
            context_lines.append(f"• Clinical Assessment Focus: {proto.get('clinical_focus')}")

            # Include targeted inquiry templates
            q_hi = proto.get("targeted_questions_hi", [])
            q_en = proto.get("targeted_questions_en", [])
            if q_hi:
                context_lines.append(f"• Standard Follow-up Questions (Hindi): {q_hi[0]}")
            if q_en:
                context_lines.append(f"• Standard Follow-up Questions (English): {q_en[0]}")

            # Red flags
            rf = proto.get("red_flags", [])
            red_flags_list.extend(rf)
            if rf:
                context_lines.append("• Mandatory Emergency Red Flags to Screen:")
                for r in rf:
                    context_lines.append(f"    - {r}")

            # Safety guidance
            if proto.get("safety_guidance"):
                context_lines.append(f"• Clinical Safety & Hydration Advice: {proto.get('safety_guidance')}")

            # Collect suggested chips
            if not suggested_chips_hi and proto.get("suggested_chips_hi"):
                suggested_chips_hi = proto.get("suggested_chips_hi")

        context_lines.append("\nINSTRUCTIONS FOR SARVAM-105B:")
        context_lines.append("1. Ground your response strictly on the verified clinical guideline above.")
        context_lines.append("2. NEVER invent non-clinical diagnoses. Act as an empathetic OPD intake triage assistant.")
        context_lines.append("3. Formulate your single follow-up question directly inspired by the Standard Follow-up Questions above.")
        context_lines.append("4. Check if the patient's complaint matches any Mandatory Emergency Red Flags. If yes, set is_priority=true.")
        context_lines.append("================================================================================")

        metadata = {
            "matched_protocol_ids": [p.get("id") for p in matched],
            "primary_protocol_title": primary_protocol.get("title") if primary_protocol else "General OPD Triage",
            "guidelines_applied": guidelines_applied,
            "suggested_chips_hi": suggested_chips_hi or [
                "2-3 दिनों से परेशानी है",
                "दवा लेने पर आराम मिलता है",
                "तकलीफ धीरे-धीरे बढ़ रही है",
                "कोई अन्य लक्षण नहीं"
            ],
            "red_flags": red_flags_list
        }

        return "\n".join(context_lines), metadata

    def check_red_flag_triggers(self, user_text: str) -> Tuple[bool, str]:
        """Rapid deterministic red-flag screening against critical emergency indicators."""
        t = (user_text or "").lower()

        # Cardiac Emergency
        if any(w in t for w in ["chest pain", "chest pressure", "seene me dard", "chhati me dard", "bayen hath me dard"]):
            if any(w in t for w in ["paseena", "sweating", "ghabrahat", "jaw", "arm", "breathless", "chakkar"]):
                return True, "Cardiac Alert: Severe chest discomfort with radiation/sweating (CSI Emergency Triage Protocol)"
            return True, "Cardiac Screening: Chest pain reported (Requires immediate 12-lead ECG review)"

        # Acute Stroke / FAST
        if any(w in t for w in ["facial droop", "slurred speech", "chehra tedha", "bolne me dikkat", "paralysis", "ek taraf kamzori"]):
            return True, "Neurological Alert: FAST positive stroke symptoms detected (Requires urgent CT Triage)"

        # Severe Respiratory
        if any(w in t for w in ["blood in cough", "balgam me khoon", "hemoptysis", "khoon ki ulti", "vomiting blood"]):
            return True, "Pulmonary/GI Alert: Active hemoptysis or hematemesis reported"

        # Acute Severe Dyspnea
        if any(w in t for w in ["saans band", "cannot breathe", "severe breathlessness", "dum ghut raha"]):
            return True, "Respiratory Alert: Acute severe dyspnea / respiratory distress"

        return False, ""


# Singleton instance
medical_rag = MedicalRAGService()
