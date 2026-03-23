import { NextRequest, NextResponse } from "next/server";
import { consultarBCRA } from "@/lib/bcra";

export async function GET(request: NextRequest) {
  const cuit = request.nextUrl.searchParams.get("cuit");

  if (!cuit) {
    return NextResponse.json({ error: "CUIT requerido" }, { status: 400 });
  }

  const result = await consultarBCRA(cuit);
  return NextResponse.json(result);
}
