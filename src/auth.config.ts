import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/homes", "/professionals"];
const AUTH_PAGES = ["/login", "/register"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Base Auth.js config: no providers here (Credentials + bcrypt + Drizzle
 * need Node APIs that aren't available in the Edge runtime middleware
 * uses). This file is safe to import from middleware; `src/auth.ts` extends
 * it with the actual Credentials provider for use in Server Actions and the
 * API route handler.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Render (and most non-Vercel hosts) sit behind a reverse proxy, so the
  // incoming Host header is the public domain, not "localhost". Auth.js
  // rejects unrecognized hosts by default (UntrustedHost error) unless
  // trustHost is set — safe here since Render terminates TLS and sets the
  // Host header itself; this isn't trusting arbitrary client input.
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const isProtectedRoute = matchesPrefix(pathname, PROTECTED_PREFIXES);
      const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

      if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", request.nextUrl);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
