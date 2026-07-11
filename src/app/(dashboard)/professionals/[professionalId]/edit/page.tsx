import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedProfessional } from "@/lib/db/ownership";
import { ProfessionalForm } from "../../professional-form";

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ professionalId: string }>;
}) {
  const { professionalId } = await params;
  const session = await auth();
  const professional = await getOwnedProfessional(professionalId, session!.user.id);

  if (!professional) {
    notFound();
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link href="/professionals" className="text-sm text-neutral-500 hover:underline">
          ← בעלי מקצוע
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">עריכת בעל מקצוע</h1>
      </div>
      <ProfessionalForm professional={professional} />
    </div>
  );
}
