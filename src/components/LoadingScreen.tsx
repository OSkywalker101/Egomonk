"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInstinctStore } from "@/lib/store";
import { preloadCoinPoster } from "@/lib/coinPosters";

const LINES = [
  "> INGESTING SIGNALS .................... OK",
  "> WEIGHING SURVIVAL TRAITS ............. OK",
  "> RESOLVING ARCHETYPE .................. OK",
  "> CALIBRATING HOLOGRAPHIC FOIL ......... OK",
];

export function LoadingScreen() {
  const computeAndReveal = useInstinctStore((s) => s.computeAndReveal);
  const setStep = useInstinctStore((s) => s.setStep);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    computeAndReveal();

    // The archetype is final from here, so start pulling its poster now. This
    // screen is up for ~3s, which is the window for the file to land before the
    // reveal needs it. Reading through getState because computeAndReveal has
    // just written the value this render has not seen yet.
    preloadCoinPoster(useInstinctStore.getState().calculatedArchetype);

    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 250 + i * 500));
    });
    timers.push(setTimeout(() => setStep(5), 250 + LINES.length * 500 + 700));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className="w-full max-w-sm font-mono text-[11px] leading-7 text-neutral-400">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {line}
          </motion.div>
        ))}
        <span className="terminal-cursor" />
      </div>

      <div className="mt-8 h-px w-full max-w-sm bg-neutral-900">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-cyan"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}