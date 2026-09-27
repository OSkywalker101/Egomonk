"use client";

import { create } from "zustand";
import type { ArchetypeKey, Answers } from "./archetypes";
import { computeArchetype, emptyAnswers } from "./archetypes";

export type Step = 0 | 1 | 2 | 3 | 4 | 5;

interface InstinctState {
  currentStep: Step;
  answers: Answers;
  companyName: string;
  calculatedArchetype: ArchetypeKey;
  setStep: (step: Step) => void;
  setCompanyName: (name: string) => void;
  recordAnswer: (weights: Partial<Answers>) => void;
  computeAndReveal: () => void;
  reset: () => void;
}

export const useInstinctStore = create<InstinctState>((set) => ({
  currentStep: 0,
  answers: emptyAnswers(),
  companyName: "",
  calculatedArchetype: "cockroach",

  setStep: (currentStep) => set({ currentStep }),

  setCompanyName: (companyName) => set({ companyName }),

  recordAnswer: (weights) =>
    set((state) => {
      const answers = { ...state.answers };
      (Object.keys(weights) as (keyof Answers)[]).forEach((key) => {
        answers[key] += weights[key] ?? 0;
      });
      return { answers };
    }),

  computeAndReveal: () =>
    set((state) => ({
      calculatedArchetype: computeArchetype(state.answers),
    })),

  reset: () =>
    set({
      currentStep: 0,
      answers: emptyAnswers(),
      companyName: "",
      calculatedArchetype: "cockroach",
    }),
}));

export function useArchetype() {
  return useInstinctStore((s) => s.calculatedArchetype);
}