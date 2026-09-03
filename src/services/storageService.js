import { INITIAL_MOCK_PATIENTS } from "../data/mockPatients";

const STORAGE_KEYS = {
  PATIENTS: "medikiosk_patients_v2",
  CURRENT_INTAKE: "medikiosk_current_intake_v2",
  DOCTOR_ACTIVE: "medikiosk_doctor_active_v1",
  ACCESSIBILITY: "medikiosk_accessibility_v1",
  LANGUAGE: "medikiosk_language_v1",
};

export const storageService = {
  // Initialize mock patients if empty
  initStorage() {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (!existing) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_MOCK_PATIENTS));
      }
    } catch (e) {
      console.warn("LocalStorage init warning:", e);
    }
  },

  // Get all patients
  getPatients() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_MOCK_PATIENTS));
        return INITIAL_MOCK_PATIENTS;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading patients from storage:", e);
      return INITIAL_MOCK_PATIENTS;
    }
  },

  // Save/Update full patients array
  savePatients(patients) {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      window.dispatchEvent(new CustomEvent("medikiosk_patients_updated", { detail: patients }));
    } catch (e) {
      console.error("Error saving patients to storage:", e);
    }
  },

  // Save a single patient (create or update)
  savePatient(patient) {
    const patients = this.getPatients();
    const index = patients.findIndex((p) => p.id === patient.id || p.token === patient.token);
    let updated;
    if (index >= 0) {
      updated = [...patients];
      updated[index] = { ...updated[index], ...patient };
    } else {
      updated = [patient, ...patients];
    }
    this.savePatients(updated);
    return patient;
  },

  // Get single patient by ID or Token
  getPatientById(idOrToken) {
    const patients = this.getPatients();
    return patients.find((p) => p.id === idOrToken || p.token === idOrToken) || null;
  },

  // Active intake draft
  getCurrentIntake() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_INTAKE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveCurrentIntake(intake) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_INTAKE, JSON.stringify(intake));
    } catch (e) {
      console.error("Error saving current intake:", e);
    }
  },

  clearCurrentIntake() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_INTAKE);
    } catch (e) {
      console.error(e);
    }
  },

  // Language preference
  getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "en";
  },

  setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  // Reset entire demo state to initial
  resetDemo() {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_MOCK_PATIENTS));
      localStorage.removeItem(STORAGE_KEYS.CURRENT_INTAKE);
      window.dispatchEvent(new CustomEvent("medikiosk_patients_updated", { detail: INITIAL_MOCK_PATIENTS }));
    } catch (e) {
      console.error("Error resetting demo:", e);
    }
  }
};
