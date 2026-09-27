"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInstinctStore } from "@/lib/store";
import { Landing } from "@/components/Landing";
import { ScenarioTerminal } from "@/components/ScenarioTerminal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CoinCanvas } from "@/components/coin/CoinCanvas";
import { CoinPoster } from "@/components/coin/CoinPoster";
import { Passport } from "@/components/Passport";

function Reveal() {
  const companyName = useInstinctStore((s) => s.companyName);
  const archetype = useInstinctStore((s) => s.calculatedArchetype);
  const [coinReady, setCoinReady] = useState(false);
  const handleMetalRevealed = useCallback(() => setCoinReady(true), []);

  return (
    <motion.div
      className="flex min-h-screen flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.7 }}
    >
      <header className="flex items-center justify-between px-6 pt-6 font-mono text-[10px] tracking-[0.3em] text-neutral-600">
        <span>THE INSTINCT SERIES</span>
        <span>
          {archetype.toUpperCase()} — FOUNDER PASSPORT
        </span>
      </header>

      <section className="relative h-[58vh] min-h-[340px] w-full">
        <CoinCanvas
          archetype={archetype}
          companyName={companyName}
          onMetalRevealed={handleMetalRevealed}
        />
        <CoinPoster archetype={archetype} hidden={coinReady} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black" />
      </section>

      <section className="flex flex-1 items-start justify-center pt-4">
        <Passport />
      </section>
    </motion.div>
  );
}

function StepView() {
  const step = useInstinctStore((s) => s.currentStep);

  switch (step) {
    case 0:
      return <Landing />;
    case 1:
    case 2:
    case 3:
      return <ScenarioTerminal />;
    case 4:
      return <LoadingScreen />;
    case 5:
      return <Reveal />;
    default:
      return <Landing />;
  }
}

export default function Home() {
  const step = useInstinctStore((s) => s.currentStep);

  return (
    <main className="relative min-h-screen bg-black text-white">
      <AnimatePresence mode="wait">
        <div key={step} className="min-h-screen">
          <StepView />
        </div>
      </AnimatePresence>
    </main>
  );
}