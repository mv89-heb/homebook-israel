import Link from "next/link";
import { ProfessionalForm } from "../professional-form";

export default function NewProfessionalPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link href="/professionals" className="text-sm text-neutral-500 hover:underline">
          ← בעלי מקצוע
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">בעל מקצוע חדש</h1>
      </div>
      <ProfessionalForm />
    </div>
  );
}
