/**
 * MediKiosk Sovereign Speech & Voice Engine
 * Integrates Sarvam AI (Bulbul:v3 Indian Voice TTS & Saaras Indian ASR)
 * with robust local Web Speech API & MediaRecorder fallback.
 */

import { apiService } from "./apiService";

const LANG_LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  pa: "pa-IN",
  od: "od-IN",
  ml: "ml-IN",
};

class SpeechService {
  constructor() {
    this.activeAudio = null;
    this.activeUtterance = null;
    this.activeRecognition = null;
    this.audioCache = new Map();
    this.sarvamChecked = false;
    this.sarvamEnabled = false;
  }

  isSpeechRecognitionSupported() {
    return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }

  isSpeechSynthesisSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  isMediaRecorderSupported() {
    return typeof window !== "undefined" && navigator?.mediaDevices?.getUserMedia !== undefined;
  }

  getLocale(lang = "en") {
    return LANG_LOCALE_MAP[lang] || "en-IN";
  }

  async checkSarvamStatus() {
    if (this.sarvamChecked) return this.sarvamEnabled;
    try {
      const status = await apiService.getSarvamStatus();
      this.sarvamEnabled = Boolean(status?.configured);
      this.sarvamChecked = true;
    } catch {
      this.sarvamEnabled = false;
    }
    return this.sarvamEnabled;
  }

  /**
   * Speaks clinical guidance/questions aloud.
   * Prioritizes Sarvam AI Bulbul:v3 for natural Indian regional speech,
   * falling back automatically to browser SpeechSynthesis.
   */
  async speakText(text, { lang = "en", rate = 0.95, pitch = 1.0, speaker = "ritu", onStart, onEnd } = {}) {
    if (!text || typeof window === "undefined") return;

    this.stopSpeaking();
    const targetLocale = this.getLocale(lang);
    const cacheKey = `${targetLocale}_${speaker}_${text.trim()}`;

    // 1. Check if audio is already cached in memory
    if (this.audioCache.has(cacheKey)) {
      try {
        const audio = new Audio(this.audioCache.get(cacheKey));
        this.activeAudio = audio;
        audio.onplay = () => onStart?.();
        audio.onended = () => {
          this.activeAudio = null;
          onEnd?.();
        };
        audio.onerror = () => this.fallbackSpeak(text, { targetLocale, rate, pitch, onStart, onEnd });
        await audio.play();
        return;
      } catch (e) {
        console.warn("Cached audio playback failed, falling back:", e);
      }
    }

    // 2. Try Sarvam AI Sovereign Voice TTS (Bulbul:v3)
    const isSarvamOn = await this.checkSarvamStatus();
    if (isSarvamOn) {
      try {
        const res = await apiService.synthesizeSarvamSpeech(text, targetLocale, speaker);
        if (res.success && res.audio_base64) {
          const audioUri = `data:audio/wav;base64,${res.audio_base64}`;
          this.audioCache.set(cacheKey, audioUri);

          const audio = new Audio(audioUri);
          this.activeAudio = audio;
          audio.onplay = () => onStart?.();
          audio.onended = () => {
            this.activeAudio = null;
            onEnd?.();
          };
          audio.onerror = () => this.fallbackSpeak(text, { targetLocale, rate, pitch, onStart, onEnd });
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("Sarvam AI TTS call failed, using browser synthesis:", err);
      }
    }

    // 3. Fallback: Browser Web Speech API SpeechSynthesis
    this.fallbackSpeak(text, { targetLocale, rate, pitch, onStart, onEnd });
  }

  fallbackSpeak(text, { targetLocale, rate = 0.95, pitch = 1.0, onStart, onEnd }) {
    if (!this.isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      utterance.lang = targetLocale;
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matched = voices.find(
          (v) => v.lang.startsWith(targetLocale) || v.lang.startsWith(targetLocale.split("-")[0])
        );
        if (matched) utterance.voice = matched;
      }

      utterance.onstart = () => onStart?.();
      utterance.onend = () => {
        this.activeUtterance = null;
        onEnd?.();
      };
      utterance.onerror = () => {
        this.activeUtterance = null;
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Browser speech synthesis error:", e);
      onEnd?.();
    }
  }

  /**
   * Play base64 encoded WAV audio directly from Sarvam Bulbul TTS
   */
  async playBase64Audio(base64Data, { onStart, onEnd } = {}) {
    if (!base64Data || typeof window === "undefined") {
      onEnd?.();
      return;
    }
    this.stopSpeaking();
    try {
      const audioUri = base64Data.startsWith("data:") ? base64Data : `data:audio/wav;base64,${base64Data}`;
      const audio = new Audio(audioUri);
      this.activeAudio = audio;
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        this.activeAudio = null;
        onEnd?.();
      };
      audio.onerror = (e) => {
        console.warn("Direct base64 audio play error:", e);
        this.activeAudio = null;
        onEnd?.();
      };
      await audio.play();
    } catch (err) {
      console.warn("playBase64Audio failed:", err);
      this.activeAudio = null;
      onEnd?.();
    }
  }

  /**
   * Stop any active audio playback or speech synthesis instantly
   */
  stopSpeaking() {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }

    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.activeUtterance = null;
    }
  }

  /**
   * Speech Recognition with live results
   */
  startListening({ lang = "en", onResult, onError, onEnd }) {
    if (!this.isSpeechRecognitionSupported()) {
      onError?.({ error: "not-supported", message: "Browser speech recognition not available" });
      return null;
    }

    try {
      this.stopListening();
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      this.activeRecognition = recognition;
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
        onError?.(event);
      };

      recognition.onend = () => {
        this.activeRecognition = null;
        onEnd?.();
      };

      recognition.start();
      return recognition;
    } catch (e) {
      onError?.(e);
      return null;
    }
  }

  stopListening() {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {}
      this.activeRecognition = null;
    }
  }
}

export const speechService = new SpeechService();
