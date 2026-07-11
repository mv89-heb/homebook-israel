import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Separate, Edge-safe NextAuth instance for middleware: uses only the base
 * config (JWT decode + redirect logic in authConfig.callbacks.authorized),
 * with no Credentials provider — so no bcrypt/Drizzle/Node-only code runs
 * in the Edge runtime.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image optimization files,
     * so the session cookie stays fresh across the whole app.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
