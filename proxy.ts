import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/portal",
  "/dashboard",
  "/locations",
  "/menu-editor",
  "/order-history",
  "/call-logs",
];

export default async function proxy(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
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
