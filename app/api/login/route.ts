import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };
  const trimmedName = username?.trim();
  if (!trimmedName) {
    return NextResponse.json(
      { ok: false, error: "Name required" },
      { status: 400 },
    );
  }
  if (!password || password !== process.env.SHARED_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Wrong password" },
      { status: 401 },
    );
  }
  // Mark the cookie as Secure only when the request actually came in over
  // HTTPS — otherwise browsers would silently drop it on plain-HTTP deploys.
  const proto =
    req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol;
  const isHttps = proto === "https" || proto === "https:";

  const res = NextResponse.json({ ok: true });
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  res.cookies.set("auth", password, common);
  res.cookies.set("username", trimmedName, common);
  return res;
}
