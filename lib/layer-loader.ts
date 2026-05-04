import "server-only";
import { listKeysByPrefix, getObjectText } from "@/lib/s3";
import { validateStructured, type Span } from "@/lib/structured";

const STRUCTURED_PREFIX = "Analysis/Structured/";

export type Layer = {
  key: string;
  fileName: string;
  username: string;
  sourceFile: string;
  layer?: string;
  description?: string;
  spans: Span[];
};

export async function loadLayersForFile(
  caseId: string,
  sourceFileName: string,
): Promise<Layer[]> {
  const target = sourceFileName.split("/").pop() ?? sourceFileName;
  const keys = await listKeysByPrefix(STRUCTURED_PREFIX);
  const jsonKeys = keys.filter((k) => k.toLowerCase().endsWith(".json"));

  const results = await Promise.all(
    jsonKeys.map(async (key): Promise<Layer | null> => {
      try {
        const text = await getObjectText(key);
        const parsed = JSON.parse(text);
        const v = validateStructured(parsed);
        if (!v.ok) return null;
        if (v.data.caseId !== caseId) return null;
        if (v.data.sourceFile !== target) return null;
        return {
          key,
          fileName: key.split("/").pop() ?? key,
          username: extractUploaderFromKey(key),
          sourceFile: v.data.sourceFile,
          layer: v.data.layer,
          description: v.data.description,
          spans: v.data.spans,
        };
      } catch {
        return null;
      }
    }),
  );

  return results.filter((r): r is Layer => r !== null);
}

// Analysis upload convention: {stem}-{YYYY-MM-DD}-{username}-v{N}.{ext}
function extractUploaderFromKey(key: string): string {
  const fileName = key.split("/").pop() ?? key;
  const stem = fileName.replace(/\.[^.]+$/, "");
  const m = stem.match(/-\d{4}-\d{2}-\d{2}-([^-]+)-v\d+$/);
  return m ? m[1] : "unknown";
}

export type StructuredMeta = {
  key: string;
  fileName: string;
  username: string;
  valid: boolean;
  caseId?: string;
  sourceFile?: string;
  layer?: string;
  description?: string;
  spanCount?: number;
  error?: string;
};

export async function loadStructuredMetadata(): Promise<
  Map<string, StructuredMeta>
> {
  const keys = await listKeysByPrefix(STRUCTURED_PREFIX);
  const jsonKeys = keys.filter((k) => k.toLowerCase().endsWith(".json"));
  const entries = await Promise.all(
    jsonKeys.map(async (key): Promise<StructuredMeta> => {
      const fileName = key.split("/").pop() ?? key;
      const username = extractUploaderFromKey(key);
      try {
        const text = await getObjectText(key);
        const parsed = JSON.parse(text);
        const v = validateStructured(parsed);
        if (!v.ok) {
          return { key, fileName, username, valid: false, error: v.error };
        }
        return {
          key,
          fileName,
          username,
          valid: true,
          caseId: v.data.caseId,
          sourceFile: v.data.sourceFile,
          layer: v.data.layer,
          description: v.data.description,
          spanCount: v.data.spans.length,
        };
      } catch (err) {
        return {
          key,
          fileName,
          username,
          valid: false,
          error: err instanceof Error ? err.message : "Parse error",
        };
      }
    }),
  );
  return new Map(entries.map((e) => [e.key, e]));
}
