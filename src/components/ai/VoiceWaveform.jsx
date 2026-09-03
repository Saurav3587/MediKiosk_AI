import React from "react";
import { motion } from "framer-motion";

export function VoiceWaveform({ active = false, barCount = 18 }) {
  const bars = Array.from({ length: barCount });

  return (
    <div className="flex items-center justify-center gap-1 h-10 px-4 py-2 bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-700 max-w-xs mx-auto">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={
            active
              ? {
                  height: [8, Math.max(12, Math.floor(Math.sin(i * 0.8) * 28 + 12)), 8],
                }
              : { height: 6 }
          }
          transition={{
            duration: 0.6 + (i % 5) * 0.1,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: (i % 4) * 0.08,
          }}
          className={`w-1 rounded-full ${
            active
              ? i % 3 === 0
                ? "bg-teal-400"
                : i % 2 === 0
                ? "bg-mediblue-400"
                : "bg-cyan-300"
              : "bg-slate-600"
          }`}
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
}
