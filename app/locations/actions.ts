"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addLocation(formData: FormData) {
  const supabase = createClient();

  const name = formData.get("name") as string;
  const phone_number = formData.get("phone_number") as string;
  const pos_type = formData.get("pos_type") as string;
  const pos_api_key = (formData.get("pos_api_key") as string) || null;
  const tax_rate = parseFloat(formData.get("tax_rate") as string) / 100;
  const client_email = ((formData.get("client_email") as string) ?? "").trim() || null;

  let user_id: string | null = null;
  if (client_email) {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const match = data?.users?.find((u) => u.email === client_email);
    if (match) user_id = match.id;
  }

  const { error } = await supabase.from("locations").insert({
    name,
    phone_number,
    pos_type,
    pos_api_key,
    tax_rate,
    is_active: true,
    user_id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/locations");
}
