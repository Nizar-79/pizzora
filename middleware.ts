import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const adminRoutes = [
  "/dashboard",
  "/locations",
  "/menu-editor",
  "/order-history",
  "/call-logs",
];

const protectedRoutes = [
  "/portal",
  "/dashboard",
  "/locations",
  "/menu-editor",
  "/order-history",
  "/call-logs",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminRoute = adminRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (isAdminRoute) {
    const svc = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    const { data: loc } = await svc
      .from("locations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loc) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/locations",
    "/locations/:path*",
    "/menu-editor",
    "/menu-editor/:path*",
    "/order-history",
    "/order-history/:path*",
    "/call-logs",
    "/call-logs/:path*",
  ],
};
