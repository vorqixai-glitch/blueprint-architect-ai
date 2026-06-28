import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ description: z.string().trim().min(3).max(2000) });

const SYSTEM = `You are a Master Blueprint Architect. Convert the user's simple description into a structured build plan.

Return ONLY valid JSON matching exactly this shape (no markdown, no commentary):
{
  "buildPrompt": {
    "style": string,
    "keyFeatures": string[],           // 5+ items
    "aesthetic": string,
    "technicalConstraints": string[],
    "aiParameters": {
      "resolution": string,
      "aspectRatio": string,
      "styleReference": string,
      "negativePrompts": string[]
    },
    "renderPrompt": string             // a single cinematic prompt string ready for image gen
  },
  "masterBlueprint": {
    "structural": {
      "dimensions": string,            // LxWxH
      "loadBearingMaterials": string[],
      "foundation": string
    },
    "systems": {
      "hvac": string,
      "energy": string,
      "water": string
    },
    "aesthetic": {
      "facadeMaterials": string[],
      "interiorLayout": string
    }
  },
  "workflow": [
    { "phase": string, "title": string, "steps": string[], "tools": string[] }
  ]
}

Be specific, technical, and ambitious. No placeholders.`;

export const generateBlueprint = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.description },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace billing.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status} ${await res.text().catch(() => "")}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    try {
      return JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("Model returned non-JSON output");
    }
  });
