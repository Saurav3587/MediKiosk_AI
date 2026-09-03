import React from "react";
import { Sun, Moon } from "lucide-react";
import { useAccessibility } from "../../context/AccessibilityContext";

export function ThemeToggle({ className = "", compact = false }) {
  const { darkMode, toggleDarkMode } = useAccessibility();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 active:scale-95 ${
        darkMode
          ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-sm"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
      } ${className}`}
    >
      {darkMode ? (
        <Sun className="w-4 h-4 transform rotate-0 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 transform -rotate-12 transition-transform" />
      )}
      {!compact && (
        <span className="sr-only">
          {darkMode ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
