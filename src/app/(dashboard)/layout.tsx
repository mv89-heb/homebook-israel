import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Defense in depth: middleware already blocks unauthenticated access to
  // this route group, but every protected layout re-checks server-side too,
  // since middleware can be bypassed by misconfiguration and this call is
  // cheap (session comes from the already-verified JWT cookie).
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-display text-lg font-bold text-neutral-900">
            HomeBook Israel
          </Link>
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              לוח בקרה
            </Link>
            <Link
              href="/professionals"
              className="rounded-lg px-3 py-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              בעלי מקצוע
            </Link>
            <Link
              href="/profile"
              className="rounded-lg px-3 py-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              פרופיל
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="!px-3 !py-1.5">
                התנתקות
              </Button>
            </form>
          </nav>
          {/* Mobile: just sign out in the header, navigation lives in the bottom bar */}
          <form action={signOut} className="lg:hidden">
            <Button type="submit" variant="ghost" className="!px-3 !py-1.5 text-sm">
              התנתקות
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 lg:pb-8">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
