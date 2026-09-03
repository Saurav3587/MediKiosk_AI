import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { PatientProvider } from "./context/PatientContext";
import { DoctorProvider } from "./context/DoctorContext";

// Patient Experience Pages
import { LandingPage } from "./pages/LandingPage";
import { IdentifyPage } from "./pages/patient/IdentifyPage";
import { LanguagePage } from "./pages/patient/LanguagePage";
import { ConsentPage } from "./pages/patient/ConsentPage";
import { HistoryPage } from "./pages/patient/HistoryPage";
import { DocumentsPage } from "./pages/patient/DocumentsPage";
import { ReviewPage } from "./pages/patient/ReviewPage";
import { CompletePage } from "./pages/patient/CompletePage";

// Doctor Experience Pages
import { DoctorAuthPage } from "./pages/doctor/DoctorAuthPage";
import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage";
import { DoctorPriorityPage } from "./pages/doctor/DoctorPriorityPage";
import { DoctorPatientDetailPage } from "./pages/doctor/DoctorPatientDetailPage";

// Admin Experience Pages
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminSystemPage } from "./pages/admin/AdminSystemPage";

export default function App() {
  return (
    <AccessibilityProvider>
      <PatientProvider>
        <DoctorProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing & Gateways */}
              <Route path="/" element={<LandingPage />} />

              {/* Patient Guided Intake Routes */}
              <Route path="/patient" element={<Navigate to="/patient/identify" replace />} />
              <Route path="/patient/identify" element={<IdentifyPage />} />
              <Route path="/patient/language" element={<LanguagePage />} />
              <Route path="/patient/consent" element={<ConsentPage />} />
              <Route path="/patient/history" element={<HistoryPage />} />
              <Route path="/patient/documents" element={<DocumentsPage />} />
              <Route path="/patient/review" element={<ReviewPage />} />
              <Route path="/patient/complete" element={<CompletePage />} />

              {/* Doctor Clinical Workspace Routes */}
              <Route path="/doctor" element={<DoctorAuthPage />} />
              <Route path="/doctor/queue" element={<DoctorDashboardPage />} />
              <Route path="/doctor/priority" element={<DoctorPriorityPage />} />
              <Route path="/doctor/patient/:id" element={<DoctorPatientDetailPage />} />

              {/* Admin Operations & Analytics Routes */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/system" element={<AdminSystemPage />} />

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DoctorProvider>
      </PatientProvider>
    </AccessibilityProvider>
  );
}
