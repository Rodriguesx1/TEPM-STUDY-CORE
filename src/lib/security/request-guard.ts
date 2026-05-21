import { NextResponse } from "next/server";

export function validateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowed = new Set<string>();
  if (appUrl) allowed.add(new URL(appUrl).origin);
  allowed.add(new URL(request.url).origin);

  if (!allowed.has(origin)) {
    return NextResponse.json({ error: "Origem da requisicao nao autorizada." }, { status: 403 });
  }

  return null;
}
