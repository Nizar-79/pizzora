"use server";

import { createClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/supabase-server-auth";
import { revalidatePath } from "next/cache";

export async function addMenuItem(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const location_id = formData.get("location_id") as string;
  const item_name = formData.get("item_name") as string;
  const category = formData.get("category") as string;
  const base_price = parseFloat(formData.get("base_price") as string);

  const { error } = await supabase.from("menus").insert({
    location_id,
    item_name,
    category,
    base_price,
    is_available: true,
    available_modifiers: [],
  });

  if (error) throw new Error(error.message);

  revalidatePath("/menu-editor");
}

export async function deleteMenuItem(itemId: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("menus").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/menu-editor");
}
