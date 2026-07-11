import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">HomeBook Israel</h1>
      <p className="max-w-md text-base text-neutral-600">
        פלטפורמת ניהול הבית החכם שלכם — נכסים, חדרים, פריטים, מסמכים ותחזוקה, במקום אחד.
      </p>
      <div className="flex gap-3">
        <Link href="/register">
          <Button>הרשמה</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">התחברות</Button>
        </Link>
      </div>
    </main>
  );
}
