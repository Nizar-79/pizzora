import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase-server-auth";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AuthRedirectPage() {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (location) {
    redirect("/portal");
  } else {
    redirect("/dashboard");
  }
}
