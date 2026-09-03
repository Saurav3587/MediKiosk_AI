import React from "react";
import {
  Accessibility,
  Eye,
  Volume2,
  VolumeX,
  Sliders,
  Type,
  Sparkles,
  X,
  UserCheck,
  Check,
  Moon,
  Sun
} from "lucide-react";
import { useAccessibility } from "../../context/AccessibilityContext";
import { usePatient } from "../../context/PatientContext";

export function AccessibilityMenu() {
  const {
    assistedMode,
    toggleAssistedMode,
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    audioGuidance,
    setAudioGuidance,
    reduceMotion,
    setReduceMotion,
    darkMode,
    toggleDarkMode,
    isMenuOpen,
    setIsMenuOpen,
  } = useAccessibility();

  const { t } = usePatient();

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        aria-label="Accessibility options"
        className="fixed bottom-3 left-3 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-navy-900 border border-slate-300 shadow-lg hover:border-mediblue-400 hover:shadow-xl transition text-xs font-semibold"
      >
        <Accessibility className="w-4 h-4 text-mediblue-600" />
        <span className="hidden sm:inline">Accessibility</span>
      </button>

      {/* Accessibility Modal Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-mediblue-100 text-mediblue-700">
                  <Accessibility className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {t.accessibilityMenu?.title || "Accessibility Options"}
                  </h3>
                  <p className="text-xs text-slate-500">Customise display & assistance</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu options list */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Assisted Mode Highlight Card */}
              <div
                onClick={toggleAssistedMode}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                  assistedMode
                    ? "bg-mediblue-50 border-mediblue-500 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    assistedMode ? "bg-mediblue-600 text-white" : "bg-white text-slate-600"
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {t.accessibilityMenu?.assistedMode || "Assisted Mode (Elderly / Low-Literacy)"}
                    </span>
                    {assistedMode && <Check className="w-4 h-4 text-mediblue-600 font-bold" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.accessibilityMenu?.assistedModeDesc ||
                      "Enlarges buttons, increases font size, and displays one question per screen with audio narration."}
                  </p>
                </div>
              </div>

              {/* Text Sizing */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  {t.accessibilityMenu?.textSize || "Text Size"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "normal", label: t.accessibilityMenu?.normal || "Normal", sizeClass: "text-xs" },
                    { id: "lg", label: t.accessibilityMenu?.large || "Large", sizeClass: "text-sm font-medium" },
                    { id: "xl", label: t.accessibilityMenu?.extraLarge || "Extra Large", sizeClass: "text-base font-bold" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTextSize(item.id)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition ${
                        textSize === item.id
                          ? "bg-navy-900 text-white border-navy-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={item.sizeClass}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    {darkMode ? (
                      <Moon className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-slate-700" />
                    )}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {darkMode ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      darkMode ? "bg-mediblue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-800">
                      {t.accessibilityMenu?.highContrast || "High Contrast Mode"}
                    </span>
                  </div>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      highContrast ? "bg-mediblue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        highContrast ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Audio Guidance */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    {audioGuidance ? (
                      <Volume2 className="w-4 h-4 text-mediblue-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-800">
                      {t.accessibilityMenu?.audioGuidance || "Audio Guidance / Narration"}
                    </span>
                  </div>
                  <button
                    onClick={() => setAudioGuidance(!audioGuidance)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      audioGuidance ? "bg-mediblue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        audioGuidance ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-800">
                      {t.accessibilityMenu?.reduceMotion || "Reduce Motion & Animations"}
                    </span>
                  </div>
                  <button
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      reduceMotion ? "bg-mediblue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        reduceMotion ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
