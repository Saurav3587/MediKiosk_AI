from typing import Dict, Any, Tuple

class AIEngine:
    @staticmethod
    def evaluate_priority_triggers(answers: Dict[str, Any]) -> Tuple[bool, str]:
        chief = answers.get("chief_complaint", "")
        radiation = answers.get("chest_radiation", "")
        duration = answers.get("chest_duration", "")
        breath = answers.get("breath_duration", "")

        if chief == "chest_discomfort":
            if radiation in ["left_arm", "jaw_neck", "back_shoulder_blades"]:
                return True, "Acute retrosternal chest discomfort with radiation to upper extremities/jaw warrants prompt triage."
            if duration in ["today_few_hours", "last_night"]:
                return True, "New-onset chest discomfort reported within last 24 hours."
        elif chief == "shortness_breath" and breath in ["at_rest", "night_episodes"]:
            return True, "Dyspnea at rest or nocturnal paroxysms flagged for prompt clinical review."

        return False, ""

    @staticmethod
    def synthesize_history(patient_name: str, age: int, gender: str, answers: Dict[str, Any], documents: list = None) -> Dict[str, Any]:
        chief = answers.get("chief_complaint", "General medical consultation")
        if chief == "chest_discomfort":
            chief_text = "Chest discomfort and retrosternal pressure"
        elif chief == "shortness_breath":
            chief_text = "Shortness of breath and respiratory discomfort"
        elif chief == "fever":
            chief_text = "Acute febrile illness with chills"
        elif chief == "abdominal_pain":
            chief_text = "Epigastric discomfort and hyperacidity"
        else:
            chief_text = chief.replace("_", " ").title()

        hpi = f"{age}-year-old {gender.lower()} presents with {chief_text.lower()}. "
        if answers.get("chest_duration") or answers.get("general_duration"):
            hpi += f"Commenced {answers.get('chest_duration') or answers.get('general_duration')}. "
        if answers.get("chest_character"):
            hpi += f"Characterized as {answers.get('chest_character').replace('_', ' ')}. "
        if answers.get("chest_radiation") and answers.get("chest_radiation") != "nowhere":
            hpi += f"Radiation to {answers.get('chest_radiation').replace('_', ' ')}. "

        is_priority, priority_reason = AIEngine.evaluate_priority_triggers(answers)

        ai_summary = f"{age}-year-old {gender.lower()} presenting with {chief_text.lower()}. "
        if is_priority:
            ai_summary += f"PRIORITY REVIEW: {priority_reason}"
        else:
            ai_summary += "Structured clinical history prepared for physician review."

        return {
            "chiefComplaint": chief_text,
            "hpi": hpi,
            "pastMedicalHistory": "Known case of: " + ", ".join(answers.get("past_medical_history", [])) if answers.get("past_medical_history") else "None declared.",
            "pastSurgicalHistory": answers.get("past_surgeries", "None"),
            "currentMedications": [{"name": answers.get("current_medications", "None"), "frequency": "Reported intake", "source": "Patient Interview"}] if answers.get("current_medications") else [],
            "allergies": [{"allergen": a, "reaction": "Hypersensitivity", "source": "Patient Interview"} for a in answers.get("drug_allergies", []) if a != "no_allergies"],
            "familyHistory": "Positive family history: " + ", ".join(answers.get("family_history", [])) if answers.get("family_history") else "Non-contributory.",
            "lifestyle": {"tobacco": "Yes" if "tobacco_smoking" in answers.get("lifestyle_habits", []) else "No", "alcohol": "Reported" if "alcohol_consumption" in answers.get("lifestyle_habits", []) else "No"},
            "reviewOfSystems": {"general": ", ".join(answers.get("review_of_systems", [])) if answers.get("review_of_systems") else "Unremarkable"},
            "aiSummary": ai_summary,
            "isPriority": is_priority,
            "priorityReason": priority_reason
        }

ai_engine = AIEngine()
