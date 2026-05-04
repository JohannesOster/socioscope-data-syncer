"use server";

import { cookies } from "next/headers";
import { listKeysByPrefix, putObject } from "@/lib/s3";
import { validateStructured } from "@/lib/structured";

const PREFIXES = {
  unstructured: "Analysis/Unstructured/",
  structured: "Analysis/Structured/",
} as const;

type Mode = keyof typeof PREFIXES;

export type UploadResult =
  | { ok: true; originalName: string; key: string; version: number }
  | { ok: false; originalName: string; error: string };

function splitNameAndExt(name: string): { stem: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { stem: name, ext: "" };
  return { stem: name.slice(0, dot), ext: name.slice(dot + 1) };
}

function sanitize(part: string): string {
  return part.replace(/[/\\]/g, "_").trim();
}

async function nextVersion(
  prefix: string,
  stem: string,
  date: string,
  username: string,
): Promise<number> {
  const lookup = `${prefix}${stem}-${date}-${username}-v`;
  const keys = await listKeysByPrefix(lookup);
  let max = 0;
  for (const k of keys) {
    const tail = k.slice(lookup.length);
    const m = tail.match(/^(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  const rawMode = (formData.get("mode") as string | null) ?? "unstructured";
  const mode: Mode = rawMode === "structured" ? "structured" : "unstructured";
  const originalName = file instanceof File ? file.name : "unknown";

  try {
    const cookieStore = await cookies();
    const username = cookieStore.get("username")?.value;
    if (!username) {
      return { ok: false, originalName, error: "Not authenticated" };
    }
    if (!(file instanceof File)) {
      return { ok: false, originalName, error: "No file provided" };
    }
    if (file.size === 0) {
      return { ok: false, originalName, error: "File is empty" };
    }

    const { stem, ext } = splitNameAndExt(file.name);

    if (mode === "structured") {
      if (ext.toLowerCase() !== "json") {
        return {
          ok: false,
          originalName,
          error: "Structured uploads must be .json",
        };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch (err) {
        return {
          ok: false,
          originalName,
          error: `Invalid JSON: ${err instanceof Error ? err.message : "parse error"}`,
        };
      }
      const v = validateStructured(parsed);
      if (!v.ok) {
        return { ok: false, originalName, error: v.error };
      }
    }

    const safeStem = sanitize(stem);
    const safeUsername = sanitize(username);
    const date = new Date().toISOString().slice(0, 10);
    const prefix = PREFIXES[mode];

    const version = await nextVersion(prefix, safeStem, date, safeUsername);
    const suffix = ext ? `.${ext}` : "";
    const key = `${prefix}${safeStem}-${date}-${safeUsername}-v${version}${suffix}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await putObject(key, buffer, file.type || undefined);

    return { ok: true, originalName, key, version };
  } catch (err) {
    return {
      ok: false,
      originalName,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}
