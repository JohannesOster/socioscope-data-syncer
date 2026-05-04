export type FileMeta = {
  fileName: string;
  ext: string;
  type: "transcription" | "video" | "audio" | "image" | "pdf" | "other";
  parts: {
    caseId?: string;
    date?: string;
    kind?: string;
    subkind?: string;
    index?: string;
    version?: string;
    country?: string;
    langFrom?: string;
    langTo?: string;
  };
};

const EXT_TO_TYPE: Record<string, FileMeta["type"]> = {
  csv: "transcription",
  mp4: "video",
  mov: "video",
  webm: "video",
  m4a: "audio",
  mp3: "audio",
  wav: "audio",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  pdf: "pdf",
};

export function parseFileName(key: string): FileMeta {
  const fileName = key.split("/").pop() ?? key;
  const dotIdx = fileName.lastIndexOf(".");
  const ext = (dotIdx >= 0 ? fileName.slice(dotIdx + 1) : "").toLowerCase();
  const stem = dotIdx >= 0 ? fileName.slice(0, dotIdx) : fileName;
  const type = EXT_TO_TYPE[ext] ?? "other";

  // Convention: {CASE}-{NUM}-{YYYY}-{MM}-{DD}-{KIND}-{SUBKIND}-{N}-{VERSION}-{COUNTRY}-{LANG_FROM}-{LANG_TO}
  const segs = stem.split("-");
  const parts: FileMeta["parts"] = {};
  if (segs.length >= 12) {
    parts.caseId = `${segs[0]}-${segs[1]}`;
    parts.date = `${segs[2]}-${segs[3]}-${segs[4]}`;
    parts.kind = segs[5];
    parts.subkind = segs[6];
    parts.index = segs[7];
    parts.version = segs[8];
    parts.country = segs[9];
    parts.langFrom = segs[10];
    parts.langTo = segs[11];
  }
  return { fileName, ext, type, parts };
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function humanLabel(meta: FileMeta): string {
  const { kind, subkind } = meta.parts;
  if (!kind) return meta.fileName;
  const pretty = (s: string) =>
    s
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  return subkind ? `${pretty(kind)} — ${pretty(subkind)}` : pretty(kind);
}
