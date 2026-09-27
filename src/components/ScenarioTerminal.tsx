"use client";

import { motion } from "framer-motion";
import { QUESTIONS } from "@/lib/questions";
import { useInstinctStore } from "@/lib/store";

export function ScenarioTerminal() {
  const currentStep = useInstinctStore((s) => s.currentStep);
  const recordAnswer = useInstinctStore((s) => s.recordAnswer);
  const setStep = useInstinctStore((s) => s.setStep);

  const index = Math.min(currentStep - 1, QUESTIONS.length - 1);
  const question = QUESTIONS[index];
  const total = QUESTIONS.length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-10 flex w-full max-w-xl items-center justify-between font-mono text-[10px] tracking-[0.3em] text-neutral-600">
        <span>SCENARIO {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-px w-8 ${
                i <= index ? "bg-accent-cyan" : "bg-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={question.id}
        className="paper-slip w-full max-w-xl px-7 py-8 sm:px-10 sm:py-10"
        initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="font-mono text-[10px] tracking-[0.35em] text-neutral-600">
          {question.scenario}
        </div>

        <h2 className="mt-6 font-serif text-2xl font-medium leading-snug text-white sm:text-3xl">
          {question.prompt}
        </h2>

        <div className="mt-9 flex flex-col gap-3">
          {question.options.map((option, i) => {
            return (
              <motion.button
                key={option.id}
                onClick={() => {
                  recordAnswer(option.weights);
                  if (currentStep === total) {
                    setStep(4);
                  } else {
                    setStep((currentStep + 1) as 1 | 2 | 3);
                  }
                }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.4 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                className="group flex items-start gap-4 border border-neutral-800 bg-black px-5 py-4 text-left transition-colors hover:border-accent-cyan/60"
              >
                <span className="mt-0.5 font-mono text-[11px] text-accent-cyan">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-mono text-xs leading-relaxed text-neutral-300 transition-colors group-hover:text-white">
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="mt-6 font-mono text-[10px] tracking-[0.3em] text-neutral-600">
        SELECT A PROTOCOL TO CONTINUE
      </div>
    </div>
  );
}