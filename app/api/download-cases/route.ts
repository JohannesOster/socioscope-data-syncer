import { Readable } from "node:stream";
import archiver from "archiver";
import { listCaseFiles, getObjectStream } from "@/lib/s3";
import { parseFileName, type FileMeta } from "@/lib/files";

const MAX_CASES = 100;

function kindMatches(
  fileKind: string | undefined,
  selectedKinds: string[],
): boolean {
  if (selectedKinds.length === 0) return true;
  if (!fileKind) return false;
  return selectedKinds.some(
    (k) => fileKind === k || fileKind.startsWith(k + "_"),
  );
}

function formatMatches(
  fileType: FileMeta["type"],
  selectedFormats: string[],
): boolean {
  if (selectedFormats.length === 0) return true;
  return selectedFormats.includes(fileType);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const caseIds = (url.searchParams.get("caseIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const kinds = (url.searchParams.get("kinds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const formats = (url.searchParams.get("formats") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (caseIds.length === 0) {
    return jsonError("caseIds required", 400);
  }
  if (caseIds.length > MAX_CASES) {
    return jsonError(`At most ${MAX_CASES} cases per request`, 400);
  }

  const archive = archiver("zip", { zlib: { level: 1 } });
  const useSubfolders = caseIds.length > 1;

  (async () => {
    try {
      let totalFiles = 0;
      for (const caseId of caseIds) {
        const files = await listCaseFiles(caseId);
        for (const f of files) {
          const meta = parseFileName(f.key);
          if (!kindMatches(meta.parts.kind, kinds)) continue;
          if (!formatMatches(meta.type, formats)) continue;
          const stream = await getObjectStream(f.key);
          const baseName = f.key.split("/").pop() ?? f.key;
          archive.append(stream, {
            name: useSubfolders ? `${caseId}/${baseName}` : baseName,
          });
          totalFiles++;
        }
      }
      if (totalFiles === 0) {
        archive.destroy(new Error("No matching files"));
        return;
      }
      await archive.finalize();
    } catch (err) {
      archive.destroy(err as Error);
    }
  })();

  const filename =
    caseIds.length === 1
      ? `${caseIds[0]}.zip`
      : `cases-${caseIds.length}.zip`;

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
