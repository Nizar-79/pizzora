"use server";

import { createClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/supabase-server-auth";
import { revalidatePath } from "next/cache";

export async function updatePosSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const locationId = formData.get("locationId") as string;
  const pos_type = formData.get("pos_type") as string;
  const keepExistingKey = formData.get("keepExistingKey") === "true";

  const updateData: Record<string, string | null> = { pos_type };

  if (!keepExistingKey) {
    updateData.pos_api_key = (formData.get("pos_api_key") as string).trim() || null;
  }

  const { error } = await supabase
    .from("locations")
    .update(updateData)
    .eq("id", locationId);

  if (error) throw new Error(error.message);

  revalidatePath("/locations");
}
