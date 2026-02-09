import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Marketing routes: locale prefix as-needed (SEO — /pricing vs /es/pricing)
const marketingMiddleware = createMiddleware(routing);

// Paths served by the [locale] marketing route group
const marketingPaths = ["/", "/pricing"];

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

export default function proxy(request: NextRequest) {
  if (isMarketingRequest(request.nextUrl.pathname)) {
    return marketingMiddleware(request);
  }

  // App/auth routes: pass through without locale rewriting.
  // next-intl resolves locale from NEXT_LOCALE cookie or Accept-Language
  // header via getLocale() in server components.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)" ],
};
