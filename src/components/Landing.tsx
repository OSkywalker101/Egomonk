"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useInstinctStore } from "@/lib/store";

export function Landing() {
  const companyName = useInstinctStore((s) => s.companyName);
  const setCompanyName = useInstinctStore((s) => s.setCompanyName);
  const setStep = useInstinctStore((s) => s.setStep);
  const [touched, setTouched] = useState(false);

  const valid = companyName.trim().length > 0;

  return (
    <motion.div
      key="landing"
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <span className="font-mono text-[11px] tracking-[0.45em] text-neutral-500">
        EGOMONK PRESENTS
      </span>

      <h1 className="mt-6 font-serif text-5xl font-black leading-none tracking-tight sm:text-7xl">
        THE INSTINCT
        <span className="iridescent-text block">SERIES</span>
      </h1>

      <p className="mt-8 max-w-md font-mono text-xs leading-relaxed text-neutral-400 sm:text-sm">
        A spatial narrative quiz that maps your organizational survival instinct
        to one of four archetypes — then mints it as a physical token.
        <span className="terminal-cursor" />
      </p>

      <form
        className="mt-12 flex w-full max-w-sm flex-col items-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setStep(1);
        }}
      >
        <label className="w-full text-left font-mono text-[11px] tracking-[0.3em] text-neutral-500">
          NAME YOUR ORGANIZATION
        </label>
        <div className="w-full border border-neutral-800 bg-black px-4 py-3 transition-colors focus-within:border-accent-cyan">
          <input
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (!touched) setTouched(true);
            }}
            placeholder="_"
            className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-neutral-700"
            autoFocus
          />
        </div>
        <motion.button
          type="submit"
          disabled={!valid}
          whileHover={valid ? { scale: 1.04 } : undefined}
          whileTap={valid ? { scale: 0.98 } : undefined}
          className="group flex items-center gap-3 border border-white/20 px-8 py-4 font-mono text-xs tracking-[0.3em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
        >
          BEGIN THE SIMULATION
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </motion.button>
      </form>

      <div className="pointer-events-none absolute bottom-8 flex w-full items-center justify-center gap-6 font-mono text-[10px] tracking-[0.3em] text-neutral-600">
        <span>WHY</span>
        <span className="text-neutral-500">/</span>
        <span>WHAT</span>
        <span className="text-neutral-500">/</span>
        <span>HOW</span>
      </div>
    </motion.div>
  );
}