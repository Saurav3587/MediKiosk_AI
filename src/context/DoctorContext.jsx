import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiService } from "../services/apiService";

const DoctorContext = createContext(null);

export function DoctorProvider({ children }) {
  const [doctorProfile, setDoctorProfile] = useState(() => {
    const stored = localStorage.getItem("medikiosk_doctor_profile");
    const token = localStorage.getItem("medikiosk_doctor_token");
    if (stored && token) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fall through
      }
    }
    return {
      id: "DOC-8401",
      name: "Dr. Arun Sharma",
      title: "MD, Senior Consultant Physician",
      department: "General Medicine",
      opdRoom: "OPD Room 14 (Ground Floor)",
      hospital: "Apex Super Specialty Hospital",
      email: "dr.arun@medikiosk.in",
      isLoggedIn: !!token,
    };
  });

  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [stats, setStats] = useState({
    patientsWaiting: 0,
    intakesReady: 0,
    priorityReviews: 0,
    intakesCompleted: 0,
    totalDocumentsProcessed: 0,
    avgIntakeTime: "--",
    completionRate: "--",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticate doctor and hydrate profile
  const loginDoctor = (profile) => {
    const updatedProfile = { ...profile, isLoggedIn: true };
    setDoctorProfile(updatedProfile);
    localStorage.setItem("medikiosk_doctor_profile", JSON.stringify(updatedProfile));
  };

  const logoutDoctor = () => {
    apiService.logoutDoctor();
    setDoctorProfile((prev) => ({ ...prev, isLoggedIn: false }));
  };

  // Hydrate doctor session on initial mount
  useEffect(() => {
    const token = localStorage.getItem("medikiosk_doctor_token");
    if (token) {
      apiService.getCurrentDoctor().then((res) => {
        if (res.success && res.data) {
          setDoctorProfile(res.data);
        }
      });
    } else {
      // Auto-authenticate default demo doctor session for seamless clinic workflow
      apiService
        .loginDoctor({
          email: "dr.arun@medikiosk.in",
          password: "doctor123",
        })
        .then((res) => {
          if (res.success && res.doctor) {
            loginDoctor(res.doctor);
            refreshPatients();
          }
        });
    }
  }, []);

  // Load patients from PostgreSQL database via backend
  const refreshPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queueRes, statsRes] = await Promise.all([
        apiService.getPatientQueue(),
        apiService.getDashboardStats(),
      ]);
      if (queueRes.success && queueRes.data) setPatients(queueRes.data);
      else setError("Failed to load patient queue from database.");
      if (statsRes?.data) setStats(statsRes.data);
    } catch (e) {
      setError("Cannot connect to backend database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPatients();

    // Auto-refresh on new patient intake events
    const handleUpdate = () => refreshPatients();
    window.addEventListener("medikiosk_patients_updated", handleUpdate);

    // Poll the database every 30 seconds for new patients
    const interval = setInterval(refreshPatients, 30000);

    return () => {
      window.removeEventListener("medikiosk_patients_updated", handleUpdate);
      clearInterval(interval);
    };
  }, [refreshPatients]);

  // Verify patient clinical history in PostgreSQL
  const verifyPatientHistory = async (patientId, notes = "") => {
    const res = await apiService.verifyHistory(patientId, doctorProfile.name, notes);
    if (res.success) {
      if (activePatient?.id === patientId || activePatient?.token === patientId) {
        setActivePatient(res.data);
      }
      refreshPatients();
      return res.data;
    }
    return null;
  };

  // Start consultation — updates status in PostgreSQL
  const startConsultation = async (patientId) => {
    const res = await apiService.startConsultation(patientId);
    if (res.success) {
      if (activePatient?.id === patientId || activePatient?.token === patientId) {
        setActivePatient(res.data);
      }
      refreshPatients();
      return res.data;
    }
    return null;
  };

  // Select patient from PostgreSQL database by ID or token
  const selectPatient = async (idOrToken) => {
    setIsLoading(true);
    const res = await apiService.getPatient(idOrToken);
    if (res.success && res.data) {
      setActivePatient(res.data);
    }
    setIsLoading(false);
    return res.data;
  };

  return (
    <DoctorContext.Provider
      value={{
        doctorProfile,
        setDoctorProfile,
        loginDoctor,
        logoutDoctor,
        patients,
        activePatient,
        setActivePatient,
        stats,
        isLoading,
        error,
        refreshPatients,
        verifyPatientHistory,
        startConsultation,
        selectPatient,
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctor() {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error("useDoctor must be used within DoctorProvider");
  }
  return context;
}
