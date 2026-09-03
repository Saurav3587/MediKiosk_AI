import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, HeartPulse, ShieldCheck, Home } from "lucide-react";
import { MediKioskLogo } from "../components/common/MediKioskLogo";
import { LanguageSelector } from "./LanguageSelector";
import { ProgressStepper } from "./ProgressStepper";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { AccessibilityMenu } from "../components/accessibility/AccessibilityMenu";
import { NetworkStatus } from "../components/common/NetworkStatus";
import { DemoToolbar } from "../components/common/DemoToolbar";
import { usePatient } from "../context/PatientContext";

export function PatientLayout({ children, activeStepId, hideStepper = false }) {
  const location = useLocation();
  const { t, patientInfo } = usePatient();

  // Determine active step from path if not explicitly provided
  let step = activeStepId;
  if (!step) {
    if (location.pathname.includes("identify")) step = "identify";
    else if (location.pathname.includes("language")) step = "language";
    else if (location.pathname.includes("consent")) step = "consent";
    else if (location.pathname.includes("history")) step = "history";
    else if (location.pathname.includes("documents")) step = "documents";
    else if (location.pathname.includes("review")) step = "review";
    else if (location.pathname.includes("complete")) step = "complete";
  }

  return (
    <div className="min-h-screen bg-clinical-surface text-clinical-text flex flex-col font-sans selection:bg-mediblue-100">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90 transition">
            <MediKioskLogo size="default" showTagline={false} />
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LanguageSelector />

            <Link
              to="/"
              className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Return to home"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Guided Top Stepper */}
      {!hideStepper && step && <ProgressStepper activeStepId={step} />}

      {/* Main Guided Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {children}
      </main>

      {/* Trust & ABHA Footer Strip */}
      <footer className="py-4 border-t border-slate-200/60 text-center text-xs text-slate-400 select-none">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-mediblue-600" />
            <span>Encrypted Session • Privacy Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
              ABHA / ABDM Architecture Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Accessibility & Network Utilities */}
      <AccessibilityMenu />
      <NetworkStatus />
    </div>
  );
}
