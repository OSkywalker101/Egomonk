"use client";

import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import {
  Bug,
  Flame,
  Sparkles,
  Layers,
  Download,
  Box,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { ArchetypeKey } from "@/lib/archetypes";
import { ARCHETYPES } from "@/lib/archetypes";
import { useInstinctStore } from "@/lib/store";
import { downloadDiagnosticsPDF } from "@/lib/pdf";
import { buildCoinSTL, downloadSTL } from "@/lib/stl";

const ARCHETYPE_ICONS: Record<ArchetypeKey, LucideIcon> = {
  cockroach: Bug,
  bull: Flame,
  unicorn: Sparkles,
  chameleon: Layers,
};

function InstinctCard() {
  const { companyName, calculatedArchetype } = useInstinctStore();
  const archetype = ARCHETYPES[calculatedArchetype];
  const Icon = ARCHETYPE_ICONS[calculatedArchetype];
  const qrValue =
    "egomonk://instinct/" +
    calculatedArchetype +
    "/" +
    encodeURIComponent(companyName || "unnamed");

  return (
    <div className="paper-slip flex w-full max-w-2xl flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
      <div className="flex flex-1 flex-col">
        <div className="font-mono text-[10px] tracking-[0.35em] text-neutral-500">
          {archetype.number} — EGOMONK
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Icon size={18} strokeWidth={1.5} className="text-accent-cyan" />
          <h2 className="font-serif text-3xl font-black tracking-tight text-white">
            {archetype.label}
          </h2>
        </div>

        <p className="mt-2 font-mono text-xs leading-relaxed text-neutral-300">
          {archetype.trait}
        </p>

        <p className="mt-3 max-w-md font-serif text-sm italic leading-relaxed text-neutral-500">
          {archetype.text}
        </p>

        <div className="mt-4 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-neutral-500">
          <span className="text-white">{companyName || "YOUR COMPANY"}</span>
          <span className="text-neutral-700">·</span>
          <span>MINTED {new Date().getFullYear()}</span>
          <span className="text-neutral-700">·</span>
          <span className="iridescent-text font-bold">CLASSIFIED</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 border border-neutral-800 bg-black p-3">
        <QRCode
          value={qrValue}
          size={92}
          bgColor="#000000"
          fgColor="#e6f7ff"
        />
        <span className="font-mono text-[9px] tracking-[0.25em] text-neutral-600">
          SCAN TO MATCH
        </span>
      </div>
    </div>
  );
}

export function Passport() {
  const { companyName, calculatedArchetype, reset } = useInstinctStore();

  const handleSTL = () => {
    const file = `egomonk-instinct-${calculatedArchetype}.stl`;
    downloadSTL(buildCoinSTL(10, 1.5, 96), file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      className="flex w-full flex-col items-center gap-7 px-4 pb-14"
    >
      <InstinctCard />

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={downloadDiagnosticsPDF}
          className="ghost-btn flex items-center gap-2.5 border border-white/20 px-6 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white transition-colors hover:border-accent-cyan/70 hover:text-accent-cyan"
        >
          <Download size={14} />
          DIAGNOSTICS (.PDF)
        </button>

        <button
          onClick={handleSTL}
          className="ghost-btn flex items-center gap-2.5 border border-white/20 px-6 py-3.5 font-mono text-[11px] tracking-[0.22em] text-white transition-colors hover:border-accent-cyan/70 hover:text-accent-cyan"
        >
          <Box size={14} />
          EXPORT TOKEN (.STL)
        </button>

        <button
          onClick={reset}
          className="ghost-btn flex items-center gap-2.5 border border-neutral-800 px-6 py-3.5 font-mono text-[11px] tracking-[0.22em] text-neutral-500 transition-colors hover:border-white/30 hover:text-white"
        >
          <RotateCcw size={14} />
          RERUN
        </button>
      </div>

      <div className="pointer-events-none select-none font-mono text-[10px] tracking-[0.35em] text-neutral-700">
        {companyName || "ANONYMOUS"} — THE INSTINCT SERIES — {calculatedArchetype.toUpperCase()} — EGOMONK
      </div>
    </motion.div>
  );
}