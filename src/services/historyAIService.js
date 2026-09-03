/**
 * MediKiosk AI Clinical History Synthesis Engine
 * Structures patient natural language / conversational responses into standard clinical formats (HPI, PMH, ROS).
 * Formulates physician draft summary and evaluates red-flag triggers.
 * STRICT CLINICAL UX RULE: Does NOT diagnose diseases or prescribe medications.
 */

export const historyAIService = {
  // Check whether answers trigger a priority review
  evaluatePriorityTriggers(answers = {}) {
    const chief = answers.chief_complaint;
    const radiation = answers.chest_radiation;
    const duration = answers.chest_duration;
    const breathTiming = answers.breath_duration;

    let isPriority = false;
    let priorityReason = "";

    if (chief === "chest_discomfort") {
      if (radiation === "left_arm" || radiation === "jaw_neck" || radiation === "back_shoulder_blades") {
        isPriority = true;
        priorityReason = "Acute retrosternal chest discomfort with radiation to upper extremities/jaw warrants immediate triage.";
      } else if (duration === "today_few_hours" || duration === "last_night") {
        isPriority = true;
        priorityReason = "New-onset chest discomfort reported within last 24 hours.";
      }
    } else if (chief === "shortness_breath") {
      if (breathTiming === "at_rest" || breathTiming === "night_episodes") {
        isPriority = true;
        priorityReason = "Dyspnea at rest or nocturnal paroxysms flagged for prompt clinical review.";
      }
    }

    return { isPriority, priorityReason };
  },

  // Synthesize structured clinical history object from intake answers
  synthesizeStructuredHistory(patient, answers = {}, documents = []) {
    const age = patient.age || 48;
    const gender = patient.gender || "Male";
    const name = patient.name || "Patient";

    // Chief complaint
    let chiefComplaint = "General medical consultation";
    if (answers.chief_complaint === "chest_discomfort") chiefComplaint = "Chest discomfort and retrosternal pressure";
    else if (answers.chief_complaint === "shortness_breath") chiefComplaint = "Shortness of breath and respiratory discomfort";
    else if (answers.chief_complaint === "fever") chiefComplaint = "Acute febrile illness with chills";
    else if (answers.chief_complaint === "abdominal_pain") chiefComplaint = "Epigastric discomfort and hyperacidity";
    else if (answers.chief_complaint === "joint_back_pain") chiefComplaint = "Joint and musculoskeletal pain";
    else if (answers.chief_complaint === "headache_dizziness") chiefComplaint = "Severe headache and lightheadedness";

    // HPI
    let hpi = `${age}-year-old ${gender.toLowerCase()} presents with ${chiefComplaint.toLowerCase()}. `;
    if (answers.chest_duration || answers.general_duration) {
      hpi += `Symptoms commenced ${answers.chest_duration || answers.general_duration}. `;
    }
    if (answers.chest_character) {
      hpi += `Described as ${answers.chest_character.replace(/_/g, " ")}. `;
    }
    if (answers.chest_radiation && answers.chest_radiation !== "nowhere") {
      hpi += `Radiating to ${answers.chest_radiation.replace(/_/g, " ")}. `;
    }
    hpi += `Intake completed via MediKiosk digital assistant.`;

    // Past history
    let pastMedicalHistory = "No previous chronic medical conditions declared.";
    if (Array.isArray(answers.past_medical_history) && answers.past_medical_history.length > 0 && !answers.past_medical_history.includes("none")) {
      pastMedicalHistory = "Known case of: " + answers.past_medical_history.map(s => s.replace(/_/g, " ").toUpperCase()).join(", ") + ".";
    }

    // Past Surgeries
    let pastSurgicalHistory = "No history of previous surgeries.";
    if (answers.past_surgeries && answers.past_surgeries !== "no_surgeries") {
      pastSurgicalHistory = `Previous surgery: ${answers.past_surgeries.replace(/_/g, " ")}.`;
    }

    // Medications
    let currentMedications = [];
    if (answers.current_medications && answers.current_medications !== "no_medicines") {
      currentMedications.push({
        name: answers.current_medications.replace(/_/g, " "),
        frequency: "Reported regular intake",
        source: "Patient Interview",
      });
    }

    // Append doc medications if any
    documents.forEach((doc) => {
      if (doc.extractedData?.medications) {
        doc.extractedData.medications.forEach((med) => {
          currentMedications.push({
            name: med.name,
            frequency: med.dose || "Per prescription",
            source: `${doc.type} (${doc.date || "Recent"})`,
            sourceId: doc.id,
            sourceDoc: doc.type,
          });
        });
      }
    });

    // Allergies
    let allergies = [];
    if (Array.isArray(answers.drug_allergies) && !answers.drug_allergies.includes("no_allergies")) {
      answers.drug_allergies.forEach((allergy) => {
        allergies.push({
          allergen: allergy.replace(/_/g, " "),
          reaction: "Reported hypersensitivity",
          source: "Patient Interview",
        });
      });
    }

    // Family History
    let familyHistory = "Non-contributory.";
    if (Array.isArray(answers.family_history) && !answers.family_history.includes("family_none")) {
      familyHistory = "Positive family history of: " + answers.family_history.map(f => f.replace("family_", "").replace(/_/g, " ")).join(", ") + ".";
    }

    // Lifestyle
    let lifestyle = {
      diet: "Regular diet",
      exercise: "Moderate",
      sleep: "Adequate",
      tobacco: answers.lifestyle_habits?.includes("tobacco_smoking") ? "Yes" : "No",
      alcohol: answers.lifestyle_habits?.includes("alcohol_consumption") ? "Reported" : "No",
    };

    // Review of systems
    let reviewOfSystems = {
      general: Array.isArray(answers.review_of_systems) ? answers.review_of_systems.join(", ") : "Unremarkable",
    };

    // AI Summary
    const { isPriority, priorityReason } = this.evaluatePriorityTriggers(answers);
    const aiSummary = `${age}-year-old ${gender.toLowerCase()} presenting with ${chiefComplaint.toLowerCase()}. ${
      isPriority ? `PRIORITY NOTE: ${priorityReason}` : "Clinical history organized for physician consultation."
    }`;

    return {
      chiefComplaint,
      hpi,
      pastMedicalHistory,
      pastSurgicalHistory,
      currentMedications,
      allergies,
      familyHistory,
      lifestyle,
      reviewOfSystems,
      aiSummary,
      isPriority,
      priorityReason,
    };
  }
};
