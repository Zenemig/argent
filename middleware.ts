import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Marketing routes: locale prefix as-needed (SEO — /pricing vs /es/pricing)
const marketingMiddleware = createMiddleware(routing);

// App/auth routes: never add locale prefix (clean URLs — /gear, /login)
const appMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: "never",
});

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

export default function middleware(request: NextRequest) {
  if (isMarketingRequest(request.nextUrl.pathname)) {
    return marketingMiddleware(request);
  }
  return appMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)" ],
};
