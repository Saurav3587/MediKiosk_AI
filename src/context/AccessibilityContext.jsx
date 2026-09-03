import React, { createContext, useContext, useState, useEffect } from "react";
import { speechService } from "../services/speechService";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [assistedMode, setAssistedMode] = useState(false);
  const [textSize, setTextSize] = useState("normal"); // 'normal' | 'lg' | 'xl'
  const [highContrast, setHighContrast] = useState(false);
  const [audioGuidance, setAudioGuidance] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medikiosk_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply HTML class modifications
  useEffect(() => {
    const root = document.documentElement;

    // Dark mode
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("medikiosk_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("medikiosk_theme", "light");
    }

    // Text scaling
    root.classList.remove("text-scale-lg", "text-scale-xl");
    if (textSize === "lg") root.classList.add("text-scale-lg");
    if (textSize === "xl") root.classList.add("text-scale-xl");

    // High contrast
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduce motion
    if (reduceMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Assisted Mode overrides
    if (assistedMode) {
      document.body.classList.add("assisted-mode");
    } else {
      document.body.classList.remove("assisted-mode");
    }
  }, [textSize, highContrast, reduceMotion, assistedMode, darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const speakGuidance = (text, lang = "en") => {
    speechService.speakText(text, { lang });
  };

  const toggleAssistedMode = () => {
    setAssistedMode((prev) => {
      const next = !prev;
      if (next) {
        setTextSize("xl");
        setAudioGuidance(true);
      } else {
        setTextSize("normal");
      }
      return next;
    });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        assistedMode,
        setAssistedMode,
        toggleAssistedMode,
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        audioGuidance,
        setAudioGuidance,
        reduceMotion,
        setReduceMotion,
        isMenuOpen,
        setIsMenuOpen,
        speakGuidance,
        darkMode,
        setDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
