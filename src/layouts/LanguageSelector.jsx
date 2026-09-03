import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { LANGUAGES } from "../locales/translations";
import { usePatient } from "../context/PatientContext";

export function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = usePatient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-mediblue-400 text-xs font-semibold text-slate-700 shadow-sm transition ${
          compact ? "px-2 py-1 text-[11px]" : ""
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-mediblue-600" />
        <span>{currentLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Select Language
          </div>

          <div className="max-h-60 overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                    isSelected ? "bg-mediblue-50 font-bold text-mediblue-800" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-mediblue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
