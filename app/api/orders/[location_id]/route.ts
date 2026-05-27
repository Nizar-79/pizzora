import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ location_id: string }> }
) {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient();
  const { location_id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  let query = supabase
    .from("orders")
    .select("*")
    .eq("location_id", location_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
