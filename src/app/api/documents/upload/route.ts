import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Endpoint descontinuado. Use o fluxo seguro: upload privado pelo cliente autenticado e processamento via /api/documents/process.",
    },
    { status: 410 },
  );
}
