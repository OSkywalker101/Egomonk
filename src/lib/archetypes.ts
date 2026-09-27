export type ArchetypeKey = "cockroach" | "bull" | "unicorn" | "chameleon";

export type WeightKey = "resilience" | "momentum" | "growth" | "reinvention";

export interface Answers {
  resilience: number;
  momentum: number;
  growth: number;
  reinvention: number;
}

export interface Archetype {
  key: ArchetypeKey;
  label: string;
  number: string;
  trait: string;
  text: string;
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  cockroach: {
    key: "cockroach",
    label: "Cockroach",
    number: "Instinct 01",
    trait: "Built for storms and the raw refusal to quit.",
    text: "You are near-indestructible. When the market turns hostile you do not flinch — you cut burn, hoard optionality, and outlast every shock.",
  },
  bull: {
    key: "bull",
    label: "Bull",
    number: "Instinct 02",
    trait: "Power through friction; consistency wins the long game.",
    text: "You are a brute-force compounder. You move ahead of fear, trust repetition over inspiration, and let time do the math.",
  },
  unicorn: {
    key: "unicorn",
    label: "Unicorn",
    number: "Instinct 03",
    trait: "Rare by design; compounding velocity is the edge.",
    text: "You are engineered for hyper-growth. You bet on the improbable, move at the speed of insight, and make scale your habitat.",
  },
  chameleon: {
    key: "chameleon",
    label: "Chameleon",
    number: "Instinct 04",
    trait: "Adapt before you're forced to; shape-shift to survive.",
    text: "You are a re-inventor. You cannibalize your own models, turn identity into a weapon, and blend before the terrain changes.",
  },
};

export const ARCHETYPE_KEYS: ArchetypeKey[] = [
  "cockroach",
  "bull",
  "unicorn",
  "chameleon",
];

export const WEIGHT_KEYS: WeightKey[] = [
  "resilience",
  "momentum",
  "growth",
  "reinvention",
];

export const WEIGHT_TO_ARCHETYPE: Record<WeightKey, ArchetypeKey> = {
  resilience: "cockroach",
  momentum: "bull",
  growth: "unicorn",
  reinvention: "chameleon",
};

export function computeArchetype(answers: Answers): ArchetypeKey {
  let best: WeightKey = "resilience";
  let bestScore = -Infinity;
  for (const key of WEIGHT_KEYS) {
    const score = answers[key];
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return WEIGHT_TO_ARCHETYPE[best];
}

export function emptyAnswers(): Answers {
  return {
    resilience: 0,
    momentum: 0,
    growth: 0,
    reinvention: 0,
  };
}