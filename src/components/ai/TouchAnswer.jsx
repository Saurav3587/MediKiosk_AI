import React, { useState } from "react";
import { Check, Send, AlertCircle, Sparkles, Stethoscope, Leaf } from "lucide-react";
import { usePatient } from "../../context/PatientContext";
import { useAccessibility } from "../../context/AccessibilityContext";

export function TouchAnswer({
  options = [],
  isMultiSelect = false,
  onSelectOption,
  onTextSubmit,
  showTextInput = false,
}) {
  const { language, t } = usePatient();
  const { assistedMode } = useAccessibility();
  const [selectedIds, setSelectedIds] = useState([]);
  const [typedText, setTypedText] = useState("");

  const handleToggleOption = (opt) => {
    if (isMultiSelect) {
      const isSelected = selectedIds.includes(opt.id);
      let next;
      if (opt.id === "none" || opt.id === "family_none" || opt.id === "no_allergies" || opt.id === "no_medicines") {
        next = [opt.id];
      } else {
        next = isSelected ? selectedIds.filter((id) => id !== opt.id) : [...selectedIds.filter(id => !id.includes("none")), opt.id];
      }
      setSelectedIds(next);
    } else {
      onSelectOption(opt.id, language === "hi" ? (opt.labelHi || opt.labelEn) : opt.labelEn);
    }
  };

  const handleConfirmMulti = () => {
    if (selectedIds.length > 0) {
      const selectedLabels = options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => (language === "hi" ? (o.labelHi || o.labelEn) : o.labelEn))
        .join(", ");
      onSelectOption(selectedIds, selectedLabels);
      setSelectedIds([]);
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (typedText.trim()) {
      onTextSubmit?.(typedText.trim());
      setTypedText("");
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Option Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {options.map((opt) => {
          const isSelected = isMultiSelect ? selectedIds.includes(opt.id) : false;
          const label = language === "hi" ? (opt.labelHi || opt.labelEn) : opt.labelEn;

          return (
            <button
              key={opt.id}
              onClick={() => handleToggleOption(opt)}
              type="button"
              className={`option-btn text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group active:scale-[0.98] ${
                isSelected
                  ? "bg-mediblue-50 border-mediblue-600 shadow-sm"
                  : "bg-white border-slate-200 hover:border-mediblue-300 hover:bg-slate-50/80 shadow-soft"
              } ${assistedMode ? "min-h-[4.5rem]" : "min-h-[3.5rem]"}`}
            >
              <div className="flex items-center gap-3 pr-2">
                {opt.icon === "Stethoscope" && <Stethoscope className="w-5 h-5 text-mediblue-600 flex-shrink-0" />}
                {opt.icon === "Leaf" && <Leaf className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                <span
                  className={`font-semibold text-slate-800 group-hover:text-mediblue-800 ${
                    assistedMode ? "text-base sm:text-lg" : "text-sm sm:text-base"
                  }`}
                >
                  {label}
                </span>
              </div>

              {isMultiSelect ? (
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSelected ? "bg-mediblue-600 border-mediblue-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-mediblue-500 flex items-center justify-center flex-shrink-0 opacity-40 group-hover:opacity-100">
                  <div className="w-2 h-2 rounded-full bg-mediblue-600 opacity-0 group-hover:opacity-100" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Select Done Button */}
      {isMultiSelect && selectedIds.length > 0 && (
        <div className="text-center pt-2 max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={handleConfirmMulti}
            className="w-full py-3.5 px-6 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Continue with Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Typing Option Form */}
      {showTextInput && (
        <form onSubmit={handleSendText} className="max-w-2xl mx-auto pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={t.aiInterview?.typePlaceholder || "Type your answer here..."}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-mediblue-500 bg-white text-sm"
            />
            <button
              type="submit"
              disabled={!typedText.trim()}
              className="px-5 py-3 rounded-2xl bg-navy-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t.aiInterview?.btnSendText || "Send"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
