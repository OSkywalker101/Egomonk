import type { WeightKey, Answers } from "./archetypes";

export interface QuizOption {
  id: string;
  label: string;
  weights: Partial<Answers>;
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  prompt: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "liquidity",
    scenario: "SCENARIO 01 // MARKET LIQUIDITY DROPS 80% OVERNIGHT",
    prompt: "Your runway just vaporized. What is your immediate protocol?",
    options: [
      {
        id: "q1-a",
        label: "Cut everything non-essential, protect cash, and outlast the shock.",
        weights: { resilience: 2, momentum: 0, growth: 0, reinvention: 0 },
      },
      {
        id: "q1-b",
        label: "Sprint to the most defensible revenue and muscle through the chaos.",
        weights: { momentum: 2, resilience: 1 },
      },
      {
        id: "q1-c",
        label: "Raise aggressively while you can — scarcity widens the moat for winners.",
        weights: { growth: 2, momentum: 1 },
      },
      {
        id: "q1-d",
        label: "Pivot the model entirely and quietly become someone else.",
        weights: { reinvention: 2, resilience: 1 },
      },
    ],
  },
  {
    id: "taste",
    scenario: "SCENARIO 02 // THE MARKET FORGETS YOU",
    prompt: "Demand for your core product flatlines. Nobody is watching. Do you...",
    options: [
      {
        id: "q2-a",
        label: "Hibernate the product and guard the balance sheet until the cycle turns.",
        weights: { resilience: 2, momentum: 0, growth: 0, reinvention: 0 },
      },
      {
        id: "q2-b",
        label: "Double down on distribution, persistence, and grinding out the win.",
        weights: { momentum: 2, growth: 1 },
      },
      {
        id: "q2-c",
        label: "Ship the moonshot — velocity only compounds when you are underestimated.",
        weights: { growth: 2, momentum: 1 },
      },
      {
        id: "q2-d",
        label: "Rebrand the company around a fresh narrative before the rumor becomes fact.",
        weights: { reinvention: 2, growth: 1 },
      },
    ],
  },
  {
    id: "model",
    scenario: "SCENARIO 03 // YOUR OWN MODEL IS EATING YOU",
    prompt: "Your current business model still prints money — but it is dying slowly. How do you lead?",
    options: [
      {
        id: "q3-a",
        label: "Keep the old engine alive long enough to build shelter for the transition.",
        weights: { resilience: 2, momentum: 1 },
      },
      {
        id: "q3-b",
        label: "Keep executing with surgical intensity — excellence outruns decay.",
        weights: { momentum: 2, growth: 1 },
      },
      {
        id: "q3-c",
        label: "Reallocate everything into the compounding line of business, now.",
        weights: { growth: 2, reinvention: 1 },
      },
      {
        id: "q3-d",
        label: "Proactively cannibalize the old model before a stranger does it for you.",
        weights: { reinvention: 2, momentum: 1 },
      },
    ],
  },
];

export function resolveArchetype(weights: Partial<Answers>): WeightKey | null {
  for (const key of [
    "resilience",
    "momentum",
    "growth",
    "reinvention",
  ] as WeightKey[]) {
    if ((weights[key] ?? 0) > 0) return key;
  }
  return null;
}