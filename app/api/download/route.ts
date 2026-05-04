import { NextResponse } from "next/server";
import { getDownloadUrl } from "@/lib/s3";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }
  try {
    const signed = await getDownloadUrl(key);
    return NextResponse.redirect(signed, 302);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sign URL" },
      { status: 500 },
    );
  }
}
