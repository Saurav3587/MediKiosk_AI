import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Mic, Activity, Check } from "lucide-react";

/**
 * AIHealthOrb
 * Abstract, non-human clinical assistant orb with Framer Motion reactivity.
 * States: 'idle' | 'listening' | 'processing' | 'speaking' | 'complete'
 */
export function AIHealthOrb({ state = "idle", size = "default", onClick }) {
  const isCompact = size === "compact";
  const orbDimension = isCompact ? "w-20 h-20" : "w-36 h-36 sm:w-44 sm:h-44";

  // Orb gradient colors per state
  const gradientStyles = {
    idle: "from-blue-600 via-mediblue-500 to-teal-400 shadow-glow-blue",
    listening: "from-cyan-400 via-teal-500 to-emerald-400 shadow-glow-teal",
    processing: "from-indigo-600 via-purple-500 to-mediblue-500 shadow-glow-blue",
    speaking: "from-mediblue-600 via-blue-500 to-sky-400 shadow-glow-blue",
    complete: "from-emerald-600 via-teal-500 to-emerald-400 shadow-glow-teal",
  };

  return (
    <div className="relative flex items-center justify-center select-none py-2" onClick={onClick}>
      {/* Listening Expanding Ripple Rings */}
      {state === "listening" && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [1, 1.8, 2.2], opacity: [0.7, 0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className={`absolute ${orbDimension} rounded-full bg-teal-400/30 blur-md pointer-events-none`}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [1, 1.5, 1.9], opacity: [0.6, 0.2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
            className={`absolute ${orbDimension} rounded-full bg-mediblue-400/25 blur-sm pointer-events-none`}
          />
        </>
      )}

      {/* Processing Orbital Ring */}
      {state === "processing" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className={`absolute ${isCompact ? "w-24 h-24" : "w-44 h-44 sm:w-52 sm:h-52"} rounded-full border-2 border-dashed border-indigo-400/60 pointer-events-none`}
        />
      )}

      {/* Speaking Wave Pulse */}
      {state === "speaking" && (
        <motion.div
          animate={{ scale: [1, 1.15, 0.98, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${orbDimension} rounded-full bg-mediblue-400/30 blur-lg pointer-events-none`}
        />
      )}

      {/* Main Reactive AI Health Orb Body */}
      <motion.div
        animate={
          state === "idle"
            ? { scale: [1, 1.04, 1], y: [0, -4, 0] }
            : state === "listening"
            ? { scale: [1, 1.08, 1] }
            : state === "processing"
            ? { scale: [0.98, 1.03, 0.98], rotate: [0, 8, -8, 0] }
            : state === "speaking"
            ? { scale: [1, 1.06, 0.97, 1.04, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: state === "idle" ? 4 : state === "processing" ? 3 : 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative ${orbDimension} rounded-full bg-gradient-to-tr ${
          gradientStyles[state] || gradientStyles.idle
        } flex items-center justify-center shadow-2xl transition-colors duration-500 cursor-pointer overflow-hidden`}
      >
        {/* Inner Light Reflection / Glass Sheen */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />

        {/* Center Orb Icon Feedback */}
        <div className="relative z-10 text-white flex flex-col items-center justify-center">
          {state === "listening" && <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse text-white" />}
          {state === "processing" && <Activity className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />}
          {state === "complete" && <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          {(state === "idle" || state === "speaking") && (
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white/95" />
          )}
        </div>

        {/* Dynamic Inner Swirl */}
        <div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none" />
      </motion.div>
    </div>
  );
}
