// Adaptive Interview Questions for MediKiosk Clinical Assistant
export const INTERVIEW_SECTIONS = [
  { id: "chief_complaint", label: "Chief Complaint", labelHi: "मुख्य शिकायत" },
  { id: "symptoms", label: "Symptoms & HPI", labelHi: "लक्षण व अवधि" },
  { id: "past_history", label: "Past History", labelHi: "पिछला इतिहास" },
  { id: "medications", label: "Medications", labelHi: "वर्तमान दवाएं" },
  { id: "allergies", label: "Allergies", labelHi: "एलर्जी" },
  { id: "family_history", label: "Family History", labelHi: "पारिवारिक इतिहास" },
  { id: "lifestyle", label: "Lifestyle", labelHi: "दिनचर्या" },
  { id: "review_of_systems", label: "Review of Systems", labelHi: "शारीरिक समीक्षा" },
];

export const AYUSH_SECTIONS = [
  { id: "ayush_prakriti", label: "Prakriti (Dosha)", labelHi: "प्रकृति (दोष)" },
  { id: "ayush_agni", label: "Agni (Digestion)", labelHi: "अग्नि (पाचन)" },
  { id: "ayush_koshtha", label: "Koshtha (Bowel)", labelHi: "कोष्ठ (आंत)" },
  { id: "ayush_ahara_vihara", label: "Ahara & Vihara", labelHi: "आहार एवं विहार" },
];

export const QUESTION_DECISION_TREE = {
  // Step 1: Consultation Mode
  consultation_type: {
    id: "consultation_type",
    section: "chief_complaint",
    questionEn: "Hello! Please select your consultation type to begin.",
    questionHi: "नमस्ते! शुरू करने के लिए परामर्श का प्रकार चुनें।",
    options: [
      { id: "modern", labelEn: "Modern Medicine (Allopathy)", labelHi: "आधुनिक चिकित्सा (एलोपैथी)", icon: "Stethoscope" },
      { id: "ayush", labelEn: "AYUSH / Ayurveda", labelHi: "आयुष / आयुर्वेद", icon: "Leaf" },
    ],
    next: (answer) => (answer === "ayush" ? "ayush_prakriti" : "chief_complaint"),
  },

  // AYUSH: Prakriti
  ayush_prakriti: {
    id: "ayush_prakriti",
    section: "ayush_prakriti",
    questionEn: "What is your primary Ayurvedic constitution (Prakriti), if known?",
    questionHi: "यदि ज्ञात हो, तो आपकी प्रमुख आयुर्वेदिक प्रकृति (दोष) क्या है?",
    options: [
      { id: "vata", labelEn: "Vata Pradhana (Light, quick, dry skin)", labelHi: "वात प्रधान" },
      { id: "pitta", labelEn: "Pitta Pradhana (Warm, sharp appetite, acidity)", labelHi: "पित्त प्रधान" },
      { id: "kapha", labelEn: "Kapha Pradhana (Calm, sturdy, slow digestion)", labelHi: "कफ प्रधान" },
      { id: "pitta_vata", labelEn: "Pitta-Vata Dual", labelHi: "पित्त-वात द्वंद्व" },
      { id: "vata_kapha", labelEn: "Vata-Kapha Dual", labelHi: "वात-कफ द्वंद्व" },
      { id: "tridoshaja", labelEn: "Sama Prakriti / Not Sure", labelHi: "सम प्रकृति / ज्ञात नहीं" },
    ],
    next: () => "ayush_agni",
  },

  // AYUSH: Agni
  ayush_agni: {
    id: "ayush_agni",
    section: "ayush_agni",
    questionEn: "How is your appetite and digestion (Agni)?",
    questionHi: "आपकी भूख और पाचन शक्ति (अग्नि) कैसी है?",
    options: [
      { id: "sama_agni", labelEn: "Normal & Regular (Samagni)", labelHi: "सामान्य व नियमित (समाग्नि)" },
      { id: "tikshna_agni", labelEn: "Very Intense / Hyperacidity (Tikshnagni)", labelHi: "तीव्र / एसिडिटी (तीक्ष्णाग्नि)" },
      { id: "manda_agni", labelEn: "Slow / Heavy after small meals (Mandagni)", labelHi: "मन्द / भारीपन (मन्दाग्नि)" },
      { id: "vishama_agni", labelEn: "Irregular / Variable (Vishamagni)", labelHi: "अनियमित / विषमाग्नि" },
    ],
    next: () => "ayush_koshtha",
  },

  // AYUSH: Koshtha
  ayush_koshtha: {
    id: "ayush_koshtha",
    section: "ayush_koshtha",
    questionEn: "How is your bowel habit (Koshtha)?",
    questionHi: "आपका पेट साफ होने की प्रवृत्ति (कोष्ठ) कैसी है?",
    options: [
      { id: "krura", labelEn: "Hard / Constipation tendency (Krura Koshtha)", labelHi: "कब्ज की प्रवृत्ति (क्रूर कोष्ठ)" },
      { id: "madhyama", labelEn: "Moderate / Regular (Madhyama Koshtha)", labelHi: "मध्यम / नियमित (मध्यम कोष्ठ)" },
      { id: "mridu", labelEn: "Soft / Frequent loose stools (Mridu Koshtha)", labelHi: "मृदु / पतला शौच (मृदु कोष्ठ)" },
    ],
    next: () => "chief_complaint",
  },

  // Step 2: Chief Complaint
  chief_complaint: {
    id: "chief_complaint",
    section: "chief_complaint",
    questionEn: "What is the main reason for your hospital visit today?",
    questionHi: "आज आपके अस्पताल आने का मुख्य कारण क्या है?",
    options: [
      { id: "chest_discomfort", labelEn: "Chest discomfort / Tightness", labelHi: "सीने में बेचैनी या भारीपन", priorityFlag: true },
      { id: "shortness_breath", labelEn: "Shortness of breath / Cough", labelHi: "सांस फूलना या खांसी", priorityFlag: true },
      { id: "fever", labelEn: "Fever / Body aches / Chills", labelHi: "बुखार / बदन दर्द / कंपकंपी" },
      { id: "abdominal_pain", labelEn: "Stomach pain / Acidity / Nausea", labelHi: "पेट दर्द / एसिडिटी / उल्टी" },
      { id: "headache_dizziness", labelEn: "Severe headache / Dizziness", labelHi: "सिरदर्द / चक्कर आना" },
      { id: "joint_back_pain", labelEn: "Joint pain / Knee or Back pain", labelHi: "जोड़ों या घुटनों/कमर का दर्द" },
      { id: "diabetes_bp", labelEn: "High Sugar / Blood Pressure follow-up", labelHi: "शुगर या बीपी का चेकअप" },
      { id: "other", labelEn: "Other health concern (Speak/Type)", labelHi: "अन्य स्वास्थ्य समस्या" },
    ],
    next: (answer) => {
      if (answer === "chest_discomfort") return "chest_duration";
      if (answer === "shortness_breath") return "breath_duration";
      if (answer === "fever") return "fever_duration";
      return "general_duration";
    },
  },

  // Step 3A: Chest Branch - Duration
  chest_duration: {
    id: "chest_duration",
    section: "symptoms",
    questionEn: "When did this chest discomfort begin?",
    questionHi: "यह सीने की तकलीफ कब से शुरू हुई?",
    options: [
      { id: "today_few_hours", labelEn: "Just a few hours ago (Today)", labelHi: "कुछ ही घंटे पहले (आज)", priorityFlag: true },
      { id: "last_night", labelEn: "Since last night / Yesterday", labelHi: "कल रात से / कल से", priorityFlag: true },
      { id: "two_three_days", labelEn: "2 to 3 days ago", labelHi: "2 से 3 दिन पहले" },
      { id: "more_than_week", labelEn: "More than a week", labelHi: "एक सप्ताह से अधिक" },
    ],
    next: () => "chest_character",
  },

  // Step 3B: Chest Branch - Character
  chest_character: {
    id: "chest_character",
    section: "symptoms",
    questionEn: "How would you describe the discomfort sensation?",
    questionHi: "सीने में होने वाली अनुभूति कैसी है?",
    options: [
      { id: "heavy_pressure", labelEn: "Heavy pressure or tightness (Weight on chest)", labelHi: "भारी दबाव या जकड़न (सीने पर भारीपन)", priorityFlag: true },
      { id: "burning_sensation", labelEn: "Burning sensation (Heartburn like)", labelHi: "जलन (खट्टी डकार जैसी)" },
      { id: "sharp_stabbing", labelEn: "Sharp or stabbing pain with breathing", labelHi: "सांस लेने पर चुभने वाला दर्द" },
      { id: "dull_ache", labelEn: "Dull aching or mild soreness", labelHi: "हल्का धीमा दर्द" },
    ],
    next: () => "chest_radiation",
  },

  // Step 3C: Chest Branch - Radiation
  chest_radiation: {
    id: "chest_radiation",
    section: "symptoms",
    questionEn: "Does this discomfort spread or radiate anywhere?",
    questionHi: "क्या यह दर्द शरीर के किसी अन्य हिस्से में फैलता है?",
    options: [
      { id: "left_arm", labelEn: "Spreads to Left Arm / Shoulder", labelHi: "बाएं हाथ / कंधे में फैलता है", priorityFlag: true },
      { id: "jaw_neck", labelEn: "Spreads to Jaw, Neck or Throat", labelHi: "जबड़े, गर्दन या गले में", priorityFlag: true },
      { id: "back_shoulder_blades", labelEn: "Spreads to Back (Between shoulder blades)", labelHi: "पीठ में", priorityFlag: true },
      { id: "nowhere", labelEn: "Stays only in center of chest", labelHi: "केवल सीने के बीच में रहता है" },
    ],
    next: () => "past_medical_history",
  },

  // General Duration
  general_duration: {
    id: "general_duration",
    section: "symptoms",
    questionEn: "How long have you been experiencing these symptoms?",
    questionHi: "आप इन लक्षणों को कितने समय से महसूस कर रहे हैं?",
    options: [
      { id: "today", labelEn: "Started Today", labelHi: "आज शुरू हुआ" },
      { id: "two_three_days", labelEn: "2 to 3 days", labelHi: "2 से 3 दिन" },
      { id: "one_two_weeks", labelEn: "1 to 2 weeks", labelHi: "1 से 2 सप्ताह" },
      { id: "chronic_months", labelEn: "More than a month (Chronic)", labelHi: "एक महीने से अधिक (पुराना)" },
    ],
    next: () => "past_medical_history",
  },

  // Breath Duration
  breath_duration: {
    id: "breath_duration",
    section: "symptoms",
    questionEn: "When does the breathlessness feel worse?",
    questionHi: "सांस फूलने की समस्या कब ज्यादा महसूस होती है?",
    options: [
      { id: "at_rest", labelEn: "Even while sitting or resting", labelHi: "बैठे रहने या आराम करने पर भी", priorityFlag: true },
      { id: "walking_stairs", labelEn: "While walking or climbing stairs", labelHi: "चलने या सीढ़ियां चढ़ने पर" },
      { id: "lying_flat", labelEn: "When lying down flat on bed", labelHi: "बिस्तर पर सीधा लेटने पर" },
      { id: "night_episodes", labelEn: "Wakes me up at night", labelHi: "रात में नींद खुल जाती है" },
    ],
    next: () => "past_medical_history",
  },

  // Fever Duration
  fever_duration: {
    id: "fever_duration",
    section: "symptoms",
    questionEn: "Is the fever accompanied by any of the following?",
    questionHi: "क्या बुखार के साथ इनमें से कुछ भी है?",
    options: [
      { id: "chills_rigors", labelEn: "Severe chills and shivering", labelHi: "तेज़ कंपकंपी और ठंड" },
      { id: "cough_sputum", labelEn: "Productive cough with phlegm", labelHi: "खांसी के साथ बलगम" },
      { id: "burning_urine", labelEn: "Burning sensation while passing urine", labelHi: "पेशाब में जलन" },
      { id: "bodyache_only", labelEn: "Body ache & mild fatigue only", labelHi: "केवल बदन दर्द और कमजोरी" },
    ],
    next: () => "past_medical_history",
  },

  // Step 4: Past Medical History
  past_medical_history: {
    id: "past_medical_history",
    section: "past_history",
    questionEn: "Do you have any existing long-term medical conditions?",
    questionHi: "क्या आपको पहले से कोई पुरानी बीमारी या स्वास्थ्य स्थिति है?",
    isMultiSelect: true,
    options: [
      { id: "hypertension", labelEn: "High Blood Pressure (Hypertension)", labelHi: "हाई ब्लड प्रेशर (उच्च रक्तचाप)" },
      { id: "diabetes", labelEn: "Diabetes (High Sugar)", labelHi: "डायबिटीज (शुगर)" },
      { id: "heart_disease", labelEn: "Heart Problem / Previous Stent / Bypass", labelHi: "हृदय रोग / पुराना स्टेंट / बाईपास" },
      { id: "asthma_copd", labelEn: "Asthma / Bronchitis / Respiratory", labelHi: "अस्थमा / सांस की बीमारी" },
      { id: "thyroid", labelEn: "Thyroid disorder", labelHi: "थायराइड की समस्या" },
      { id: "kidney_disease", labelEn: "Kidney Disease / Stones", labelHi: "गुर्दे की बीमारी / पथरी" },
      { id: "none", labelEn: "None of these / Healthy", labelHi: "इनमें से कोई नहीं / स्वस्थ" },
    ],
    next: () => "past_surgeries",
  },

  // Step 5: Past Surgeries
  past_surgeries: {
    id: "past_surgeries",
    section: "past_history",
    questionEn: "Have you undergone any surgery or hospitalization in the past?",
    questionHi: "क्या आपकी पहले कोई सर्जरी (ऑपरेशन) या अस्पताल में भर्ती हुई है?",
    options: [
      { id: "appendectomy", labelEn: "Appendectomy (Appendix surgery)", labelHi: "अपेंडिक्स ऑपरेशन" },
      { id: "gallbladder", labelEn: "Gallbladder removal (Cholecystectomy)", labelHi: "पित्त की थैली का ऑपरेशन" },
      { id: "cardiac_stent", labelEn: "Cardiac Angioplasty / Stent", labelHi: "हार्ट एंजियोप्लास्टी / स्टेंट" },
      { id: "c_section_ortho", labelEn: "C-Section or Orthopedic surgery", labelHi: "सिजेरियन या हड्डी का ऑपरेशन" },
      { id: "other_surgery", labelEn: "Other major surgery", labelHi: "अन्य सर्जरी" },
      { id: "no_surgeries", labelEn: "No previous surgeries", labelHi: "कोई सर्जरी नहीं हुई" },
    ],
    next: () => "current_medications",
  },

  // Step 6: Current Medications
  current_medications: {
    id: "current_medications",
    section: "medications",
    questionEn: "Are you currently taking any regular daily medicines or tablets?",
    questionHi: "क्या आप वर्तमान में कोई नियमित दैनिक दवाइयां ले रहे हैं?",
    options: [
      { id: "bp_tablets", labelEn: "Blood Pressure medicines (e.g. Telmisartan, Amlodipine)", labelHi: "बीपी की दवाइयां (जैसे टेल्मिसार्टन)" },
      { id: "sugar_tablets_insulin", labelEn: "Diabetes tablets or Insulin (e.g. Metformin)", labelHi: "शुगर की दवाइयां या इंसुलिन (जैसे मेटफॉर्मिन)" },
      { id: "cholesterol_blood_thinner", labelEn: "Cholesterol / Blood thinner (e.g. Atorvastatin, Ecosprin)", labelHi: "कोलेस्ट्रॉल / खून पतला करने की दवा (एटोरवास्टेटिन)" },
      { id: "thyroid_tabs", labelEn: "Thyroid tablet (e.g. Thyroxine)", labelHi: "थायराइड की दवा (थायरोक्सिन)" },
      { id: "painkillers_vitamins", labelEn: "Painkillers or Multivitamins", labelHi: "दर्द निवारक या विटामिन" },
      { id: "no_medicines", labelEn: "Not taking any regular medicines", labelHi: "कोई नियमित दवा नहीं ले रहे" },
    ],
    next: () => "drug_allergies",
  },

  // Step 7: Drug Allergies
  drug_allergies: {
    id: "drug_allergies",
    section: "allergies",
    questionEn: "Do you have any known allergies to medicines, foods, or substances?",
    questionHi: "क्या आपको किसी दवा, खाद्य पदार्थ या अन्य चीज़ से एलर्जी है?",
    isMultiSelect: true,
    options: [
      { id: "penicillin_allergy", labelEn: "Penicillin / Amoxicillin antibiotics", labelHi: "पेनिसिलिन / अमोक्सिसिलिन एंटीबायोटिक" },
      { id: "sulfa_drugs", labelEn: "Sulfa / Septran drugs", labelHi: "सल्फा दवाएं" },
      { id: "painkillers_nsaids", labelEn: "Aspirin / Brufen / Painkillers", labelHi: "एस्पिरिन / ब्रूफेन दर्द निवारक" },
      { id: "contrast_dye", labelEn: "X-ray / CT scan contrast dye", labelHi: "सीटी स्कैन कंट्रास्ट डाई" },
      { id: "food_environmental", labelEn: "Food or dust allergy", labelHi: "धूल या खाद्य एलर्जी" },
      { id: "no_allergies", labelEn: "No known allergies (Safe)", labelHi: "कोई ज्ञात एलर्जी नहीं है" },
    ],
    next: () => "family_history",
  },

  // Step 8: Family History
  family_history: {
    id: "family_history",
    section: "family_history",
    questionEn: "Does anyone in your direct family (Parents/Siblings) have a history of:",
    questionHi: "क्या आपके परिवार (माता-पिता/भाई-बहन) में किसी को यह बीमारी रही है:",
    isMultiSelect: true,
    options: [
      { id: "family_heart_attack", labelEn: "Early Heart Attack or Stroke (Under age 60)", labelHi: "कम उम्र में हार्ट अटैक या स्ट्रोक" },
      { id: "family_diabetes", labelEn: "Type 2 Diabetes", labelHi: "डायबिटीज (शुगर)" },
      { id: "family_hypertension", labelEn: "High Blood Pressure", labelHi: "हाई ब्लड प्रेशर" },
      { id: "family_asthma", labelEn: "Asthma or severe allergies", labelHi: "अस्थमा या गंभीर एलर्जी" },
      { id: "family_cancer", labelEn: "Cancer", labelHi: "कैंसर" },
      { id: "family_none", labelEn: "No significant family history", labelHi: "कोई विशेष पारिवारिक इतिहास नहीं" },
    ],
    next: () => "lifestyle_habits",
  },

  // Step 9: Lifestyle Habits
  lifestyle_habits: {
    id: "lifestyle_habits",
    section: "lifestyle",
    questionEn: "A quick question regarding your lifestyle and habits:",
    questionHi: "आपकी दिनचर्या और आदतों के बारे में संक्षिप्त जानकारी:",
    isMultiSelect: true,
    options: [
      { id: "tobacco_smoking", labelEn: "Smoking / Bidi / Tobacco use", labelHi: "धूम्रपान / बीड़ी / तंबाकू का सेवन" },
      { id: "alcohol_consumption", labelEn: "Alcohol consumption (Occasional/Regular)", labelHi: "शराब का सेवन (कभी-कभार/नियमित)" },
      { id: "high_stress_desk", labelEn: "Sedentary desk work / High stress", labelHi: "बैठकर काम करना / तनाव" },
      { id: "regular_exercise", labelEn: "Regular daily exercise / Active", labelHi: "नियमित व्यायाम / सक्रिय जीवन" },
      { id: "healthy_habits", labelEn: "Non-smoker, Non-drinker", labelHi: "धूम्रपान व शराब रहित स्वस्थ आदतें" },
    ],
    next: () => "review_of_systems",
  },

  // Step 10: Review of Systems
  review_of_systems: {
    id: "review_of_systems",
    section: "review_of_systems",
    questionEn: "Lastly, are you experiencing any of these general symptoms?",
    questionHi: "अंत में, क्या आप इनमें से कोई अन्य लक्षण महसूस कर रहे हैं?",
    isMultiSelect: true,
    options: [
      { id: "ros_sweating", labelEn: "Unexplained sweating or dizziness", labelHi: "अचानक पसीना आना या चक्कर" },
      { id: "ros_fatigue", labelEn: "Unusual extreme fatigue or weakness", labelHi: "अत्यधिक थकान या कमजोरी" },
      { id: "ros_weight_change", labelEn: "Recent unintentional weight loss", labelHi: "अचानक वजन कम होना" },
      { id: "ros_sleep_issues", labelEn: "Poor sleep / Disturbed sleep", labelHi: "नींद न आना या खराब नींद" },
      { id: "ros_none", labelEn: "None of these", labelHi: "इनमें से कोई नहीं" },
    ],
    next: () => null, // End of interview
  },
};
