import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateBlueprint } from "@/lib/blueprint.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Hammer, Workflow, Wand2, Download } from "lucide-react";
import { exportBlueprintPdf } from "@/lib/blueprint-pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Master Blueprint Architect" },
      { name: "description", content: "Turn a one-line idea into a build prompt, master blueprint, and workflow." },
    ],
  }),
  component: Index,
});

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

function Index() {
  const gen = useServerFn(generateBlueprint);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await gen({ data: { description: desc } });
      setResult(r as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Master Blueprint Architect
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            From idea to blueprint
          </h1>
          <p className="mt-3 text-muted-foreground">
            Describe what you want to build. Get a render-ready prompt, technical specs, and a workflow.
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. Off-grid desert research lab for 8 scientists with vertical farming"
                rows={3}
                maxLength={2000}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{desc.length}/2000</span>
                <Button type="submit" disabled={loading || desc.trim().length < 3}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Architecting…</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Generate Blueprint</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <Section icon={<Sparkles className="h-5 w-5" />} title="1. Ultra-Detailed Build Prompt">
              <Field label="Style" value={result.buildPrompt.style} />
              <Field label="Aesthetic" value={result.buildPrompt.aesthetic} />
              <ListField label="Key Features" items={result.buildPrompt.keyFeatures} />
              <ListField label="Technical Constraints" items={result.buildPrompt.technicalConstraints} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Resolution" value={result.buildPrompt.aiParameters.resolution} />
                <Stat label="Aspect" value={result.buildPrompt.aiParameters.aspectRatio} />
                <Stat label="Style Ref" value={result.buildPrompt.aiParameters.styleReference} />
                <Stat label="Negatives" value={result.buildPrompt.aiParameters.negativePrompts.join(", ")} />
              </div>
              <div className="rounded-md border border-border bg-muted/50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Render Prompt</p>
                <p className="text-sm italic text-foreground">{result.buildPrompt.renderPrompt}</p>
              </div>
            </Section>

            <Section icon={<Hammer className="h-5 w-5" />} title="2. Master Blueprint">
              <SubHeading>Structural</SubHeading>
              <Field label="Dimensions" value={result.masterBlueprint.structural.dimensions} />
              <ListField label="Load-bearing materials" items={result.masterBlueprint.structural.loadBearingMaterials} />
              <Field label="Foundation" value={result.masterBlueprint.structural.foundation} />

              <SubHeading>Systems</SubHeading>
              <Field label="HVAC" value={result.masterBlueprint.systems.hvac} />
              <Field label="Energy" value={result.masterBlueprint.systems.energy} />
              <Field label="Water" value={result.masterBlueprint.systems.water} />

              <SubHeading>Aesthetic</SubHeading>
              <ListField label="Façade materials" items={result.masterBlueprint.aesthetic.facadeMaterials} />
              <Field label="Interior layout" value={result.masterBlueprint.aesthetic.interiorLayout} />
            </Section>

            <Section icon={<Workflow className="h-5 w-5" />} title="3. Optimized Workflow">
              <ol className="space-y-4">
                {result.workflow.map((p, i) => (
                  <li key={i} className="rounded-md border border-border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{p.phase}</Badge>
                      <h4 className="font-semibold text-foreground">{p.title}</h4>
                    </div>
                    <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                      {p.steps.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                    {p.tools?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.tools.map((t, j) => <Badge key={j} variant="outline">{t}</Badge>)}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="text-sm">
      <p className="mb-1 font-medium text-muted-foreground">{label}</p>
      <ul className="ml-5 list-disc space-y-0.5 text-foreground">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs text-foreground">{value}</p>
    </div>
  );
}
