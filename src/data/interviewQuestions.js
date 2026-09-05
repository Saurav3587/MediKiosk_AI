// Smart Clinical Interview Engine for MediKiosk Assistant
// Streamlined, symptom-focused, empathetic, and free of irrelevant interrogations.

export const INTERVIEW_SECTIONS = [
  { id: "chief_complaint", label: "Chief Complaint", labelHi: "मुख्य शिकायत" },
  { id: "symptoms", label: "Symptom Details", labelHi: "लक्षण व विवरण" },
  { id: "medications", label: "Current Medications", labelHi: "वर्तमान दवाएं" },
  { id: "allergies", label: "Drug Allergies", labelHi: "दवा एलर्जी" },
];

export const QUESTION_DECISION_TREE = {
  // Step 1: Chief Complaint (Direct, empathetic start)
  chief_complaint: {
    id: "chief_complaint",
    section: "chief_complaint",
    questionEn: "Hello! What is your main health concern or reason for visit today?",
    questionHi: "नमस्ते! आज आपको क्या तकलीफ या परेशानी हो रही है? कृपया बताएं।",
    options: [
      { id: "chest_discomfort", value: "chest_discomfort", label: "Chest discomfort / Tightness", labelEn: "Chest discomfort / Tightness", labelHi: "सीने में बेचैनी या भारीपन", priorityFlag: true },
      { id: "fever", value: "fever", label: "Fever / Body aches / Chills", labelEn: "Fever / Body aches / Chills", labelHi: "बुखार / बदन दर्द / कंपकंपी" },
      { id: "abdominal_pain", value: "abdominal_pain", label: "Stomach pain / Acidity / Vomiting", labelEn: "Stomach pain / Acidity / Vomiting", labelHi: "पेट दर्द / एसिडिटी / उल्टी" },
      { id: "shortness_breath", value: "shortness_breath", label: "Shortness of breath / Cough", labelEn: "Shortness of breath / Cough", labelHi: "सांस फूलना या खांसी", priorityFlag: true },
      { id: "headache_dizziness", value: "headache_dizziness", label: "Severe headache / Dizziness", labelEn: "Severe headache / Dizziness", labelHi: "सिरदर्द / चक्कर आना" },
      { id: "joint_back_pain", value: "joint_back_pain", label: "Joint pain / Knee or Back pain", labelEn: "Joint pain / Knee or Back pain", labelHi: "जोड़ों या घुटनों/कमर का दर्द" },
      { id: "diabetes_bp", value: "diabetes_bp", label: "Sugar or Blood Pressure checkup", labelEn: "Sugar or Blood Pressure checkup", labelHi: "शुगर या बीपी का चेकअप" },
      { id: "other", value: "other", label: "Other health concern", labelEn: "Other health concern", labelHi: "अन्य स्वास्थ्य समस्या" },
    ],
    next: (answer) => {
      if (answer === "chest_discomfort") return "chest_duration";
      if (answer === "fever") return "fever_duration";
      if (answer === "abdominal_pain") return "abdominal_duration";
      if (answer === "shortness_breath") return "breath_duration";
      if (answer === "headache_dizziness") return "headache_duration";
      if (answer === "joint_back_pain") return "joint_duration";
      return "general_duration";
    },
  },

  // Step 2A: Chest Branch - Duration
  chest_duration: {
    id: "chest_duration",
    section: "symptoms",
    questionEn: "When did this chest discomfort begin, and how intense is it?",
    questionHi: "यह सीने की तकलीफ कब से शुरू हुई, और कितनी तेज है?",
    options: [
      { id: "today_few_hours", value: "today_few_hours", label: "Just a few hours ago (Today)", labelEn: "Just a few hours ago (Today)", labelHi: "कुछ ही घंटे पहले (आज)", priorityFlag: true },
      { id: "last_night", value: "last_night", label: "Since last night / Yesterday", labelEn: "Since last night / Yesterday", labelHi: "कल रात से / कल से", priorityFlag: true },
      { id: "two_three_days", value: "two_three_days", label: "2 to 3 days ago", labelEn: "2 to 3 days ago", labelHi: "2 से 3 दिन पहले" },
      { id: "more_than_week", value: "more_than_week", label: "More than a week", labelEn: "More than a week", labelHi: "एक सप्ताह से अधिक" },
    ],
    next: () => "chest_radiation",
  },

  // Step 2B: Chest Branch - Radiation (Critical Red Flag Check)
  chest_radiation: {
    id: "chest_radiation",
    section: "symptoms",
    questionEn: "Does this chest discomfort spread or radiate to your arm, neck, or back?",
    questionHi: "क्या यह दर्द आपके बाएं हाथ, जबड़े, गर्दन या पीठ में भी फैलता है?",
    options: [
      { id: "left_arm", value: "left_arm", label: "Spreads to Left Arm / Shoulder", labelEn: "Spreads to Left Arm / Shoulder", labelHi: "बाएं हाथ / कंधे में फैलता है", priorityFlag: true },
      { id: "jaw_neck", value: "jaw_neck", label: "Spreads to Jaw or Neck", labelEn: "Spreads to Jaw or Neck", labelHi: "जबड़े या गर्दन में", priorityFlag: true },
      { id: "back_shoulder_blades", value: "back_shoulder_blades", label: "Spreads to Back", labelEn: "Spreads to Back", labelHi: "पीठ में", priorityFlag: true },
      { id: "nowhere", value: "nowhere", label: "Stays only in center of chest", labelEn: "Stays only in center of chest", labelHi: "केवल सीने के बीच में रहता है" },
    ],
    next: () => "current_medications",
  },

  // Step 2C: Fever Branch
  fever_duration: {
    id: "fever_duration",
    section: "symptoms",
    questionEn: "How long have you had fever, and do you also have chills or cough?",
    questionHi: "बुखार कितने दिनों से है, और क्या साथ में कंपकंपी या खांसी भी है?",
    options: [
      { id: "fever_chills_today", value: "fever_chills_today", label: "Started today with shivering", labelEn: "Started today with shivering", labelHi: "आज से तेज ठंड/कंपकंपी के साथ" },
      { id: "fever_2_3_days", value: "fever_2_3_days", label: "Since 2-3 days with body ache", labelEn: "Since 2-3 days with body ache", labelHi: "2-3 दिनों से बदन दर्द के साथ" },
      { id: "fever_with_cough", value: "fever_with_cough", label: "Fever with cough and throat pain", labelEn: "Fever with cough and throat pain", labelHi: "खांसी व गले में दर्द के साथ" },
      { id: "fever_prolonged", value: "fever_prolonged", label: "More than a week", labelEn: "More than a week", labelHi: "एक सप्ताह से अधिक समय से" },
    ],
    next: () => "current_medications",
  },

  // Step 2D: Abdominal Pain Branch
  abdominal_duration: {
    id: "abdominal_duration",
    section: "symptoms",
    questionEn: "Where is the stomach pain located, and do you have nausea or acidity?",
    questionHi: "पेट दर्द किस हिस्से में है, और क्या उल्टी या खट्टी डकारें भी हैं?",
    options: [
      { id: "upper_acidity", value: "upper_acidity", label: "Upper stomach burning / Acidity", labelEn: "Upper stomach burning / Acidity", labelHi: "ऊपरी पेट में जलन व खट्टी डकार" },
      { id: "severe_cramps", value: "severe_cramps", label: "Severe sharp cramps with vomiting", labelEn: "Severe sharp cramps with vomiting", labelHi: "तेज़ मरोड़ और उल्टी" },
      { id: "lower_abdomen", value: "lower_abdomen", label: "Lower abdomen / Pelvic pain", labelEn: "Lower abdomen / Pelvic pain", labelHi: "निचले पेट में दर्द" },
      { id: "mild_discomfort", value: "mild_discomfort", label: "Mild generalized heaviness", labelEn: "Mild generalized heaviness", labelHi: "हल्का भारीपन या अपच" },
    ],
    next: () => "current_medications",
  },

  // Step 2E: Breath Branch
  breath_duration: {
    id: "breath_duration",
    section: "symptoms",
    questionEn: "When does the breathlessness feel worse?",
    questionHi: "सांस फूलने की समस्या कब ज्यादा महसूस होती है?",
    options: [
      { id: "at_rest", value: "at_rest", label: "Even while resting or sitting", labelEn: "Even while resting or sitting", labelHi: "बैठे रहने या आराम करने पर भी", priorityFlag: true },
      { id: "walking_stairs", value: "walking_stairs", label: "While walking or climbing stairs", labelEn: "While walking or climbing stairs", labelHi: "चलने या सीढ़ियां चढ़ने पर" },
      { id: "lying_flat", value: "lying_flat", label: "When lying down flat in bed", labelEn: "When lying down flat in bed", labelHi: "बिस्तर पर सीधा लेटने पर" },
      { id: "with_wheezing", value: "with_wheezing", label: "With wheezing or dry cough", labelEn: "With wheezing or dry cough", labelHi: "घरघराहट या सूखी खांसी के साथ" },
    ],
    next: () => "current_medications",
  },

  // Step 2F: Headache Branch
  headache_duration: {
    id: "headache_duration",
    section: "symptoms",
    questionEn: "How would you describe the headache and associated symptoms?",
    questionHi: "सिरदर्द किस प्रकार का है और क्या चक्कर या उल्टी भी आ रही है?",
    options: [
      { id: "throbbing_migraine", value: "throbbing_migraine", label: "One-sided throbbing pain with light sensitivity", labelEn: "One-sided throbbing pain with light sensitivity", labelHi: "एक तरफ तेज़ धड़कने जैसा दर्द" },
      { id: "heavy_forehead", value: "heavy_forehead", label: "Heavy tension in forehead / Sinus pressure", labelEn: "Heavy tension in forehead / Sinus pressure", labelHi: "माथे में भारीपन या तनाव" },
      { id: "dizziness_vertigo", value: "dizziness_vertigo", label: "Dizziness and feeling off-balance", labelEn: "Dizziness and feeling off-balance", labelHi: "चक्कर आना और संतुलन बिगड़ना" },
      { id: "mild_headache", value: "mild_headache", label: "Mild dull headache since a few days", labelEn: "Mild dull headache since a few days", labelHi: "कुछ दिनों से हल्का सिरदर्द" },
    ],
    next: () => "current_medications",
  },

  // Step 2G: Joint Branch
  joint_duration: {
    id: "joint_duration",
    section: "symptoms",
    questionEn: "Which joint is painful, and is there any swelling or stiffness?",
    questionHi: "किस जोड़ में दर्द है, और क्या सूजन या जकड़न भी है?",
    options: [
      { id: "knee_pain", value: "knee_pain", label: "Knee pain / Difficulty walking", labelEn: "Knee pain / Difficulty walking", labelHi: "घुटनों का दर्द / चलने में परेशानी" },
      { id: "lower_back", value: "lower_back", label: "Lower back pain / Stiff waist", labelEn: "Lower back pain / Stiff waist", labelHi: "कमर के निचले हिस्से में दर्द" },
      { id: "multiple_joints", value: "multiple_joints", label: "Multiple joints with morning stiffness", labelEn: "Multiple joints with morning stiffness", labelHi: "कई जोड़ों में सुबह जकड़न" },
      { id: "shoulder_neck", value: "shoulder_neck", label: "Neck or shoulder pain", labelEn: "Neck or shoulder pain", labelHi: "गर्दन या कंधे का दर्द" },
    ],
    next: () => "current_medications",
  },

  // Step 2H: General Duration
  general_duration: {
    id: "general_duration",
    section: "symptoms",
    questionEn: "How long have you been experiencing these symptoms?",
    questionHi: "आप इन लक्षणों को कितने समय से महसूस कर रहे हैं?",
    options: [
      { id: "today", value: "today", label: "Started Today", labelEn: "Started Today", labelHi: "आज ही शुरू हुआ" },
      { id: "two_three_days", value: "two_three_days", label: "2 to 3 days", labelEn: "2 to 3 days", labelHi: "2 से 3 दिन" },
      { id: "one_two_weeks", value: "one_two_weeks", label: "1 to 2 weeks", labelEn: "1 to 2 weeks", labelHi: "1 से 2 सप्ताह" },
      { id: "chronic_months", value: "chronic_months", label: "More than a month (Chronic)", labelEn: "More than a month (Chronic)", labelHi: "एक महीने से अधिक (पुराना)" },
    ],
    next: () => "current_medications",
  },

  // Step 3: Essential Safety Check - Current Medications
  current_medications: {
    id: "current_medications",
    section: "medications",
    questionEn: "Are you currently taking any regular daily medicines or tablets?",
    questionHi: "क्या आप वर्तमान में कोई नियमित दैनिक दवाइयां ले रहे हैं?",
    options: [
      { id: "no_medicines", value: "no_medicines", label: "Not taking any regular medicines", labelEn: "Not taking any regular medicines", labelHi: "कोई नियमित दवा नहीं ले रहे" },
      { id: "bp_tablets", value: "bp_tablets", label: "Blood Pressure medicines (e.g. Telmisartan)", labelEn: "Blood Pressure medicines", labelHi: "बीपी की दवाइयां" },
      { id: "sugar_tablets_insulin", value: "sugar_tablets_insulin", label: "Diabetes tablets or Insulin", labelEn: "Diabetes tablets or Insulin", labelHi: "शुगर की दवाइयां या इंसुलिन" },
      { id: "thyroid_tabs", value: "thyroid_tabs", label: "Thyroid tablets (e.g. Thyroxine)", labelEn: "Thyroid tablets", labelHi: "थायराइड की दवा" },
      { id: "other_daily_meds", value: "other_daily_meds", label: "Heart / Cholesterol / Painkiller meds", labelEn: "Heart / Cholesterol / Painkiller meds", labelHi: "हार्ट / कोलेस्ट्रॉल / दर्द निवारक" },
    ],
    next: () => "drug_allergies",
  },

  // Step 4: Essential Safety Check - Drug Allergies
  drug_allergies: {
    id: "drug_allergies",
    section: "allergies",
    questionEn: "Do you have any known allergies to medicines or drugs?",
    questionHi: "क्या आपको किसी दवा या इंजेक्शन से कोई एलर्जी है?",
    options: [
      { id: "no_allergies", value: "no_allergies", label: "No known allergies (Safe)", labelEn: "No known allergies (Safe)", labelHi: "कोई ज्ञात दवा एलर्जी नहीं है" },
      { id: "penicillin_allergy", value: "penicillin_allergy", label: "Penicillin / Antibiotic allergy", labelEn: "Penicillin / Antibiotic allergy", labelHi: "पेनिसिलिन / एंटीबायोटिक से एलर्जी" },
      { id: "painkillers_nsaids", value: "painkillers_nsaids", label: "Aspirin / Painkiller allergy", labelEn: "Aspirin / Painkiller allergy", labelHi: "एस्पिरिन या दर्द निवारक से एलर्जी" },
      { id: "sulfa_drugs", value: "sulfa_drugs", label: "Sulfa medicines allergy", labelEn: "Sulfa medicines allergy", labelHi: "सल्फा दवाओं से एलर्जी" },
      { id: "other_allergy", value: "other_allergy", label: "Other medication or food allergy", labelEn: "Other medication or food allergy", labelHi: "अन्य दवा या खाद्य एलर्जी" },
    ],
    next: () => null, // Intake Complete!
  },
};
