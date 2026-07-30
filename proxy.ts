import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts to make the network boundary explicit.
// This runs on every request that matches `config.matcher` below.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // app_metadata is the trusted source (set via service role key).
  // user_metadata is a safe fallback for newly registered users before
  // app_metadata is written (e.g. when service role key is not yet configured).
  const role = (
    (user?.app_metadata?.role as string | undefined) ??
    (user?.user_metadata?.role as string | undefined) ??
    null
  );

  // /admin/login is always publicly accessible — never block it
  if (path === "/admin/login") {
    // If already logged in as admin, skip the login page
    if (user && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return response;
  }

  // Not logged in -> block protected areas
  const isAdminPath = path.startsWith("/admin");
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/book") ||
    path.startsWith("/staff") || isAdminPath;

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    // Admin routes redirect to the dedicated admin login page
    url.pathname = isAdminPath ? "/admin/login" : "/login";
    return NextResponse.redirect(url);
  }

  // Role-based gates
  if (path === "/dashboard") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "DOCTOR") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
  }

  if (path.startsWith("/staff") && role !== "DOCTOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  // Allow both ADMIN and DOCTOR to access patient profiles and EMR pages under /admin
  if (isAdminPath && role !== "ADMIN" && role !== "DOCTOR") {
    return NextResponse.redirect(new URL(
      role === "DOCTOR" ? "/staff/dashboard" : "/dashboard",
      request.url
    ));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/book/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};
