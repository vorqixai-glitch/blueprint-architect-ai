import { jsPDF } from "jspdf";

type Result = {
  buildPrompt: {
    style: string;
    keyFeatures: string[];
    aesthetic: string;
    technicalConstraints: string[];
    aiParameters: { resolution: string; aspectRatio: string; styleReference: string; negativePrompts: string[] };
    renderPrompt: string;
  };
  masterBlueprint: {
    structural: { dimensions: string; loadBearingMaterials: string[]; foundation: string };
    systems: { hvac: string; energy: string; water: string };
    aesthetic: { facadeMaterials: string[]; interiorLayout: string };
  };
  workflow: Array<{ phase: string; title: string; steps: string[]; tools: string[] }>;
};

export function exportBlueprintPdf(description: string, r: Result) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const write = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
    const { size = 11, bold = false, color = [20, 20, 20], gap = 4 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW);
    for (const ln of lines) {
      ensure(size + 2);
      doc.text(ln, margin, y);
      y += size + 2;
    }
    y += gap;
  };
  const h1 = (t: string) => { ensure(28); write(t, { size: 20, bold: true, gap: 8 }); };
  const h2 = (t: string) => {
    ensure(22);
    y += 6;
    write(t, { size: 14, bold: true, color: [60, 60, 60], gap: 4 });
    ensure(2);
    doc.setDrawColor(200);
    doc.line(margin, y - 2, pageW - margin, y - 2);
    y += 4;
  };
  const h3 = (t: string) => { ensure(16); write(t, { size: 11, bold: true, color: [80, 80, 80], gap: 2 }); };
  const kv = (k: string, v: string) => write(`${k}: ${v}`, { size: 10 });
  const bullets = (items: string[]) => items.forEach(i => write(`• ${i}`, { size: 10, gap: 1 }));

  // Header
  h1("Master Blueprint");
  write(description, { size: 10, color: [110, 110, 110], gap: 10 });

  // Section 1
  h2("1. Ultra-Detailed Build Prompt");
  kv("Style", r.buildPrompt.style);
  kv("Aesthetic", r.buildPrompt.aesthetic);
  h3("Key Features");
  bullets(r.buildPrompt.keyFeatures);
  h3("Technical Constraints");
  bullets(r.buildPrompt.technicalConstraints);
  h3("AI Generation Parameters");
  kv("Resolution", r.buildPrompt.aiParameters.resolution);
  kv("Aspect Ratio", r.buildPrompt.aiParameters.aspectRatio);
  kv("Style Reference", r.buildPrompt.aiParameters.styleReference);
  kv("Negative Prompts", r.buildPrompt.aiParameters.negativePrompts.join(", "));
  h3("Render Prompt");
  write(r.buildPrompt.renderPrompt, { size: 10, color: [40, 40, 40] });

  // Section 2
  h2("2. Master Blueprint");
  h3("Structural");
  kv("Dimensions", r.masterBlueprint.structural.dimensions);
  h3("Load-bearing materials");
  bullets(r.masterBlueprint.structural.loadBearingMaterials);
  kv("Foundation", r.masterBlueprint.structural.foundation);
  h3("Systems");
  kv("HVAC", r.masterBlueprint.systems.hvac);
  kv("Energy", r.masterBlueprint.systems.energy);
  kv("Water", r.masterBlueprint.systems.water);
  h3("Aesthetic");
  h3("Façade materials");
  bullets(r.masterBlueprint.aesthetic.facadeMaterials);
  kv("Interior layout", r.masterBlueprint.aesthetic.interiorLayout);

  // Section 3
  h2("3. Optimized Workflow");
  r.workflow.forEach((p, i) => {
    h3(`${i + 1}. ${p.phase} — ${p.title}`);
    bullets(p.steps);
    if (p.tools?.length) write(`Tools: ${p.tools.join(", ")}`, { size: 9, color: [110, 110, 110] });
  });

  const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "blueprint";
  doc.save(`${slug}.pdf`);
}
