import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { name, phone_number, pos_type, pos_api_key, tax_rate } = body;

  if (!name || !phone_number || !pos_type) {
    return NextResponse.json(
      { error: "name, phone_number, and pos_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({ name, phone_number, pos_type, pos_api_key, tax_rate })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
