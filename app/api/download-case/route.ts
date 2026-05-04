import { Readable } from "node:stream";
import archiver from "archiver";
import { listCaseFiles, getObjectStream } from "@/lib/s3";
import { parseFileName } from "@/lib/files";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  const mode = url.searchParams.get("mode") ?? "transcripts";

  if (!caseId) {
    return new Response(JSON.stringify({ error: "caseId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (mode !== "transcripts" && mode !== "all") {
    return new Response(JSON.stringify({ error: "invalid mode" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const files = await listCaseFiles(caseId);
  const selected =
    mode === "transcripts"
      ? files.filter((f) => parseFileName(f.key).type === "transcription")
      : files;

  if (selected.length === 0) {
    return new Response(
      JSON.stringify({ error: `No ${mode} files in ${caseId}` }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }

  const archive = archiver("zip", { zlib: { level: 1 } });

  // Pipe S3 streams into the archive sequentially. Sequential keeps memory low
  // for large bundles (e.g. all-files mode with ~1 GB of video).
  (async () => {
    try {
      for (const f of selected) {
        const stream = await getObjectStream(f.key);
        const name = f.key.split("/").pop() ?? f.key;
        archive.append(stream, { name });
      }
      await archive.finalize();
    } catch (err) {
      archive.destroy(err as Error);
    }
  })();

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${caseId}-${mode}.zip"`,
    },
  });
}
