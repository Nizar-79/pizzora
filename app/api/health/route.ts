import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Pizzora API",
    timestamp: new Date().toISOString(),
  });
}
