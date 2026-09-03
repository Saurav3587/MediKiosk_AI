/**
 * MediKiosk Speech Service
 * Wraps Web Speech Recognition API (with graceful fallback simulation)
 * and Web Speech Synthesis API for audio guidance narration.
 */

const LANG_LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
};

export const speechService = {
  // Check if browser has speech recognition
  isSpeechRecognitionSupported() {
    return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  },

  // Check if speech synthesis is supported
  isSpeechSynthesisSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  },

  getLocale(lang = "en") {
    return LANG_LOCALE_MAP[lang] || "en-IN";
  },

  // Start listening to microphone
  startListening({ lang = "en", onResult, onError, onEnd }) {
    if (!this.isSpeechRecognitionSupported()) {
      onError?.({ error: "not-supported", message: "Browser speech recognition not available" });
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = this.getLocale(lang);

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const isFinal = event.results[event.results.length - 1].isFinal;
        onResult?.(transcript, isFinal);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        onError?.(event);
      };

      recognition.onend = () => {
        onEnd?.();
      };

      recognition.start();
      return recognition;
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      onError?.(e);
      return null;
    }
  },

  // Speak text with SpeechSynthesis
  speakText(text, { lang = "en", rate = 0.92, pitch = 1.0, onStart, onEnd } = {}) {
    if (!this.isSpeechSynthesisSupported() || !text) return;

    try {
      window.speechSynthesis.cancel(); // stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = this.getLocale(lang);
      utterance.lang = targetLocale;
      utterance.rate = rate; // pleasant clinical pace
      utterance.pitch = pitch;

      // Select best matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(
          (v) => v.lang.startsWith(targetLocale) || v.lang.startsWith(lang)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  },

  // Stop any ongoing speech
  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
};
