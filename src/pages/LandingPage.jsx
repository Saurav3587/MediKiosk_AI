import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Mic,
  FileText,
  ShieldCheck,
  Globe,
  Stethoscope,
  Sparkles,
  Users,
  Activity,
  CheckCircle2,
  Lock,
  HeartPulse,
  Award
} from "lucide-react";
import { MediKioskLogo } from "../components/common/MediKioskLogo";
import { LanguageSelector } from "../layouts/LanguageSelector";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { AccessibilityMenu } from "../components/accessibility/AccessibilityMenu";
import { DemoToolbar } from "../components/common/DemoToolbar";
import { usePatient } from "../context/PatientContext";

export function LandingPage() {
  const { t, language } = usePatient();
  const navigate = useNavigate();

  const workflowSteps = [
    { num: 1, title: t.hero?.step1 || "Patient", desc: "Arrives at OPD or opens Kiosk", icon: Users },
    { num: 2, title: t.hero?.step2 || "AI Clinical Intake", desc: "Conversational voice & touch Q&A", icon: Mic },
    { num: 3, title: t.hero?.step3 || "Medical Records", desc: "Uploads past Rx & blood reports", icon: FileText },
    { num: 4, title: t.hero?.step4 || "Structured History", desc: "AI organizes draft & timeline", icon: Activity },
    { num: 5, title: t.hero?.step5 || "Physician Verified", desc: "Doctor reviews & verifies in OPD", icon: Stethoscope },
  ];

  const capabilities = [
    {
      title: t.hero?.capabilities?.voiceTouch?.title || "Voice + Touch Input",
      desc: t.hero?.capabilities?.voiceTouch?.desc || "Speak naturally in your language or tap quick intuitive cards on any mobile, tablet, or kiosk screen.",
      icon: Mic,
      gradient: "from-blue-600 to-teal-500",
    },
    {
      title: t.hero?.capabilities?.multilingual?.title || "Multilingual Intelligence",
      desc: t.hero?.capabilities?.multilingual?.desc || "Full support for Indian languages with conversational guidance and translated interfaces.",
      icon: Globe,
      gradient: "from-teal-600 to-emerald-500",
    },
    {
      title: t.hero?.capabilities?.docIntelligence?.title || "Medical Document OCR",
      desc: t.hero?.capabilities?.docIntelligence?.desc || "Instantly scan prescriptions, lab reports, and discharge summaries with entity extraction and confidence metrics.",
      icon: FileText,
      gradient: "from-indigo-600 to-mediblue-500",
    },
    {
      title: t.hero?.capabilities?.physicianVerified?.title || "Physician Verified",
      desc: t.hero?.capabilities?.physicianVerified?.desc || "AI structures your medical history into a clean draft for your doctor to verify. MediKiosk never diagnoses.",
      icon: ShieldCheck,
      gradient: "from-slate-900 to-navy-900",
    },
  ];

  return (
    <div className="min-h-screen bg-clinical-surface text-clinical-text flex flex-col font-sans selection:bg-mediblue-100">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/">
            <MediKioskLogo size="default" />
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-mediblue-600 transition">
              {t.nav?.howItWorks || "How It Works"}
            </a>
            <a href="#capabilities" className="hover:text-mediblue-600 transition">
              Capabilities
            </a>
            <Link to="/doctor" className="hover:text-mediblue-600 transition">
              {t.nav?.doctorLogin || "Doctor Portal"}
            </Link>
            <Link to="/admin/analytics" className="hover:text-mediblue-600 transition">
              {t.nav?.adminPortal || "Admin Analytics"}
            </Link>
          </nav>

          {/* Right Header: Theme Toggle, Language Selector & Doctor Portal Button */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LanguageSelector />

            <Link
              to="/doctor"
              className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition hidden sm:inline-flex"
            >
              {t.hero?.btnDoctor || "Doctor Login"}
            </Link>

            <Link
              to="/patient/identify"
              className="px-4 py-2 rounded-full bg-mediblue-600 hover:bg-mediblue-700 text-white text-xs font-bold shadow-sm hover:shadow transition"
            >
              {t.nav?.startIntake || "Start Intake"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-white via-mediblue-50/30 to-clinical-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* ABHA Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mediblue-50 border border-mediblue-200 text-mediblue-800 text-xs font-bold mb-6 shadow-xs animate-in fade-in slide-in-from-top-3">
            <span className="w-2 h-2 rounded-full bg-mediblue-600 animate-pulse"></span>
            <span>{t.hero?.abhaReady || "ABHA / ABDM Architecture Ready"}</span>
            <span className="text-[10px] text-mediblue-500 font-normal">• Ayushman Bharat Digital Health</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            {t.hero?.headline || "Your health history, ready before you meet the doctor."}
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.hero?.subheadline ||
              "Share your medical history using voice, touch or text and securely organize your previous health records before consultation."}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={() => navigate("/patient/identify")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <span>{t.hero?.btnStart || "Start Patient Intake"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <Link
              to="/doctor"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-base hover:bg-slate-50 transition shadow-sm"
            >
              <Stethoscope className="w-5 h-5 text-mediblue-600" />
              <span>{t.hero?.btnDoctor || "Doctor Login"}</span>
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-4 font-medium">
            Designed for smartphone, tablet, desktop & hospital touchscreen kiosks. No app download required.
          </p>
        </div>
      </section>

      {/* 5-Stage Visual Workflow Representation */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-mediblue-600 mb-2">
              Clinical Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              From Intake to Consultation in 5 Seamless Steps
            </h3>
          </div>

          {/* Workflow Chain */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="clinical-card p-5 rounded-3xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-between relative hover:border-mediblue-300 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    {step.num}
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-mediblue-100 text-mediblue-700 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 Core Capabilities */}
      <section id="capabilities" className="py-20 bg-clinical-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-mediblue-600 mb-2">
              Platform Features
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              Built for Real Indian Healthcare Workflows
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div
                  key={i}
                  className="clinical-card p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-lg transition group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cap.gradient} text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{cap.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clinical UX & Non-Diagnosis Guarantee Banner */}
      <section className="py-12 bg-navy-950 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mediblue-500/20 text-mediblue-300 border border-mediblue-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Healthcare Compliance Protocol</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold">
            MediKiosk Prepares the Story. Your Physician Makes the Diagnosis.
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            MediKiosk does NOT prescribe medications, make algorithmic medical conclusions, or replace clinical judgment. All synthesized history and extracted records require physician verification.
          </p>

          <div className="pt-2 flex justify-center gap-4 text-xs font-medium text-slate-300">
            <span>• HIPAA & ABDM Principled</span>
            <span>• Multilingual Audio Guidance</span>
            <span>• Low-Literacy Assisted Mode</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <MediKioskLogo size="compact" light={true} />
          <p>© 2026 MediKiosk Health Systems. Connected to MediKiosk Clinical Database Engine.</p>
          <div className="flex gap-4">
            <Link to="/doctor" className="hover:text-white transition">Doctor Login</Link>
            <Link to="/admin/analytics" className="hover:text-white transition">Admin Portal</Link>
            <Link to="/patient/identify" className="hover:text-white transition">Patient Intake</Link>
          </div>
        </div>
      </footer>

      <AccessibilityMenu />
    </div>
  );
}
