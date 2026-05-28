import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase";

export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies — middleware handles this
          }
        },
      },
    }
  );
}

export async function requireAdmin() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createClient();
  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (location) throw new Error("Forbidden");

  return user;
}
