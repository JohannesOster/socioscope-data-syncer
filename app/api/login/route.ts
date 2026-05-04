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
  const res = NextResponse.json({ ok: true });
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  res.cookies.set("auth", password, common);
  res.cookies.set("username", trimmedName, common);
  return res;
}
