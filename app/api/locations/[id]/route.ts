import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient();
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("locations")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
