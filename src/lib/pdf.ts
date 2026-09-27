import { jsPDF } from "jspdf";
import { useInstinctStore } from "./store";
import { ARCHETYPES } from "./archetypes";
import type { Answers } from "./archetypes";

export function downloadDiagnosticsPDF() {
  const { companyName, calculatedArchetype, answers } =
    useInstinctStore.getState();
  const archetype = ARCHETYPES[calculatedArchetype];

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

  doc.setTextColor(0, 229, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EGOMONK // THE INSTINCT SERIES", margin, margin);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Instinct Diagnostics", margin, margin + 14);

  doc.setFontSize(10);
  doc.setTextColor(170, 175, 182);
  doc.text("Company", margin, margin + 30);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(companyName || "Unnamed Company", margin, margin + 36);

  doc.setTextColor(170, 175, 182);
  doc.setFontSize(10);
  doc.text("Archetype", margin, margin + 52);
  doc.setTextColor(0, 229, 255);
  doc.text(archetype.number, margin + 40, margin + 52);
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(archetype.label, margin, margin + 58);
  doc.setTextColor(170, 175, 182);
  doc.setFontSize(10);
  doc.text(archetype.trait, margin, margin + 66);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Trait Weights", margin, margin + 88);

  const keys: (keyof Answers)[] = [
    "resilience",
    "momentum",
    "growth",
    "reinvention",
  ];
  const labels: Record<keyof Answers, string> = {
    resilience: "RESILIENCE",
    momentum: "MOMENTUM",
    growth: "GROWTH",
    reinvention: "REINVENTION",
  };

  keys.forEach((key, i) => {
    const y = margin + 96 + i * 10;
    const value = answers[key];
    const label = labels[key];
    doc.setTextColor(170, 175, 182);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(value), margin + 60, y);

    doc.setFillColor(30, 34, 40);
    doc.rect(margin + 72, y - 3.5, 40, 3, "F");
    doc.setFillColor(0, 68, 255);
    doc.rect(margin + 72, y - 3.5, 40 * Math.min(1, value / 6), 3, "F");
  });

  const y = margin + 158;
  doc.setDrawColor(60, 64, 70);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFontSize(7);
  doc.setTextColor(90, 96, 104);
  doc.text(
    "Minted by egomonk — intelligence, attention & culture.",
    margin,
    y + 8
  );

  doc.save("egomonk-instinct-diagnostics.pdf");
}