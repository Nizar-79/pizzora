import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase-server-auth";
import { createClient } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: location } = await supabase
    .from("locations")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-red-900 text-white px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🍕 Pizzora</h1>
          <p className="text-sm text-red-300">{location?.name ?? "Your Portal"}</p>
        </div>
        <LogoutButton />
      </header>
      <main className="p-8">{children}</main>
    </div>
  );
}
