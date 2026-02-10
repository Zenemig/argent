import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Marketing routes: locale prefix as-needed (SEO — /pricing vs /es/pricing)
const marketingMiddleware = createMiddleware(routing);

// Paths served by the [locale] marketing route group
const marketingPaths = ["/"];

function isMarketingRequest(pathname: string): boolean {
  if (marketingPaths.includes(pathname)) return true;

  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    const prefix = `/${locale}`;
    // /es → marketing root
    if (pathname === prefix) return true;
    // /es/pricing → marketing page
    for (const path of marketingPaths) {
      if (path !== "/" && pathname === `${prefix}${path}`) return true;
    }
  }

  return false;
}

/** Auth and public routes that don't require authentication */
function isPublicRoute(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/auth/")) return true;
  return false;
}

export default async function proxy(request: NextRequest) {
  // Create a response we can pass cookies through
  let supabaseResponse = NextResponse.next({ request });

  // Refresh Supabase auth session on every request.
  // This keeps the JWT fresh and passes updated cookies to the browser.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Set cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this triggers setAll if cookies need updating
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Landing page paths (/ and /es, /fr, etc.) — authenticated users
  // skip marketing and fall through to the app dashboard at app/(app)/page.tsx
  const isLandingPage =
    pathname === "/" ||
    routing.locales.some(
      (l) => l !== routing.defaultLocale && pathname === `/${l}`,
    );

  if (isLandingPage && user) {
    return supabaseResponse;
  }

  // Route marketing requests through next-intl middleware
  if (isMarketingRequest(pathname)) {
    const intlResponse = marketingMiddleware(request);

    // Carry Supabase auth cookies onto the intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return intlResponse;
  }

  // Public routes (login, auth callback) — no auth required
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // App routes — require authentication
  // Unauthenticated users are redirected to /login with a ?next= param
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    const redirectResponse = NextResponse.redirect(loginUrl);
    // Carry Supabase cookies onto the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Authenticated app routes: pass through
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)" ],
};
