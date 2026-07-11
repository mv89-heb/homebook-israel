import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel — hidden on mobile, the story on desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <Link href="/" className="relative text-xl font-bold">
          HomeBook Israel
        </Link>
        <div className="relative flex flex-col gap-6">
          <p className="font-display text-4xl font-medium leading-tight">
            כל מה שיודעים
            <br />
            על הבית שלכם,
            <br />
            במקום אחד.
          </p>
          <p className="max-w-sm text-brand-100">
            נכסים, חדרים, פריטים, קבלות ואחריות — מאורגן, נגיש, ובלי לחפש בין תיקיות.
          </p>
        </div>
        <div className="relative flex gap-6 text-sm text-brand-100">
          <span>🏠 בתים</span>
          <span>📄 מסמכים</span>
          <span>🔧 תחזוקה</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-4 py-12">
        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="font-display text-2xl font-medium text-neutral-900">
            HomeBook Israel
          </Link>
          <p className="mt-1 text-sm text-neutral-500">ניהול הבית החכם שלכם</p>
        </div>
        <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
