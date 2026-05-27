import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-server-auth";

export async function POST(request: Request) {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { posType, apiKey } = await request.json();

  if (!posType || posType === "none") {
    return NextResponse.json({ success: false, message: "No POS system selected." });
  }

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({ success: false, message: "API key is required." });
  }

  if (posType === "toast") {
    return NextResponse.json({
      success: true,
      message: "Toast key saved. Auto-verification is not available for Toast — your Pizzora team will confirm the connection.",
    });
  }

  const isProd = process.env.POS_ENV === "production";

  if (posType === "square") {
    const squareBase = isProd
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
    try {
      const res = await fetch(`${squareBase}/v2/merchants`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Square-Version": "2024-01-18",
        },
      });
      if (res.ok) {
        return NextResponse.json({ success: true, message: "Square connection successful." });
      }
      return NextResponse.json({ success: false, message: "Square rejected the key. Double-check and try again." });
    } catch {
      return NextResponse.json({ success: false, message: "Could not reach Square. Check your internet connection." });
    }
  }

  if (posType === "clover") {
    // Clover key format is merchantId|apiKey — extract just the apiKey for connection test
    const [, cloverApiKey] = apiKey.split("|");
    const keyToTest = cloverApiKey ?? apiKey;
    const cloverBase = isProd
      ? "https://api.clover.com"
      : "https://sandbox.dev.clover.com";
    try {
      const res = await fetch(`${cloverBase}/v3/ecomind/info`, {
        headers: { Authorization: `Bearer ${keyToTest}` },
      });
      if (res.ok) {
        return NextResponse.json({ success: true, message: "Clover connection successful." });
      }
      return NextResponse.json({ success: false, message: "Clover rejected the key. Double-check and try again." });
    } catch {
      return NextResponse.json({ success: false, message: "Could not reach Clover. Check your internet connection." });
    }
  }

  return NextResponse.json({ success: false, message: "Unknown POS type." });
}
