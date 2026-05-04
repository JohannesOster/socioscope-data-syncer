export type Span = {
  turn: number;
  start: number;
  end: number;
  quote: string;
  label?: string;
  notes?: string;
};

export type StructuredFile = {
  caseId: string;
  // Filename of the transcript CSV these spans annotate.
  // Turn indices are anchored to this file's turn enumeration.
  sourceFile: string;
  // Optional human-readable name for this layer (e.g. "stakeholder, entity").
  layer?: string;
  // Optional free-text description of what this set of annotations represents.
  description?: string;
  spans: Span[];
};

export type ValidationResult =
  | { ok: true; data: StructuredFile }
  | { ok: false; error: string };

export function validateStructured(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Expected a JSON object at the top level" };
  }
  const obj = input as Record<string, unknown>;

  const caseId = obj.caseId;
  if (typeof caseId !== "string" || !caseId.trim()) {
    return { ok: false, error: "Missing or empty 'caseId' (string)" };
  }

  const sourceFile = obj.sourceFile;
  if (typeof sourceFile !== "string" || !sourceFile.trim()) {
    return {
      ok: false,
      error:
        "Missing or empty 'sourceFile' (filename of the transcript CSV these spans annotate)",
    };
  }

  if (obj.layer !== undefined && typeof obj.layer !== "string") {
    return { ok: false, error: "'layer' must be a string when present" };
  }
  if (obj.description !== undefined && typeof obj.description !== "string") {
    return { ok: false, error: "'description' must be a string when present" };
  }

  const rawSpans = obj.spans;
  if (!Array.isArray(rawSpans)) {
    return { ok: false, error: "'spans' must be an array" };
  }

  const spans: Span[] = [];
  for (let i = 0; i < rawSpans.length; i++) {
    const s = rawSpans[i];
    if (!s || typeof s !== "object" || Array.isArray(s)) {
      return { ok: false, error: `spans[${i}]: expected object` };
    }
    const r = s as Record<string, unknown>;
    if (typeof r.turn !== "number" || !Number.isInteger(r.turn) || r.turn < 0) {
      return { ok: false, error: `spans[${i}]: 'turn' must be a non-negative integer` };
    }
    if (typeof r.start !== "number" || r.start < 0) {
      return { ok: false, error: `spans[${i}]: 'start' must be a non-negative number` };
    }
    if (typeof r.end !== "number" || r.end < r.start) {
      return { ok: false, error: `spans[${i}]: 'end' must be >= 'start'` };
    }
    if (typeof r.quote !== "string") {
      return { ok: false, error: `spans[${i}]: 'quote' must be a string` };
    }
    if (r.label !== undefined && typeof r.label !== "string") {
      return { ok: false, error: `spans[${i}]: 'label' must be a string when present` };
    }
    if (r.notes !== undefined && typeof r.notes !== "string") {
      return { ok: false, error: `spans[${i}]: 'notes' must be a string when present` };
    }
    spans.push({
      turn: r.turn,
      start: r.start,
      end: r.end,
      quote: r.quote,
      label: r.label as string | undefined,
      notes: r.notes as string | undefined,
    });
  }

  return {
    ok: true,
    data: {
      caseId: caseId.trim(),
      sourceFile: sourceFile.trim().split("/").pop() ?? sourceFile.trim(),
      layer: obj.layer ? (obj.layer as string).trim() || undefined : undefined,
      description: obj.description
        ? (obj.description as string).trim() || undefined
        : undefined,
      spans,
    },
  };
}

const PALETTE = [
  { swatch: "#FFB300", bg: "rgba(255,179,0,0.32)" },
  { swatch: "#42A5F5", bg: "rgba(66,165,245,0.28)" },
  { swatch: "#EF5350", bg: "rgba(239,83,80,0.28)" },
  { swatch: "#7E57C2", bg: "rgba(126,87,194,0.28)" },
  { swatch: "#26A69A", bg: "rgba(38,166,154,0.30)" },
  { swatch: "#EC407A", bg: "rgba(236,64,122,0.28)" },
];

// One color per uploaded file (hashed from S3 key, deterministic & stable).
// We deliberately don't hash by username/layer — that would coincide for
// distinct files and confuse readers in the viewer.
export function colorForKey(key: string): { swatch: string; bg: string } {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
