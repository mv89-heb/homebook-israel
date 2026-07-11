import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { items, professionals } from "@/db/schema";
import { getOwnedHome } from "@/lib/db/ownership";
import { MaintenanceForm } from "../maintenance-form";

export default async function NewMaintenancePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const home = await getOwnedHome(homeId, userId);
  if (!home) {
    notFound();
  }

  const [homeItems, myProfessionals] = await Promise.all([
    db.select({ id: items.id, name: items.name }).from(items).where(eq(items.homeId, homeId)),
    db
      .select({ id: professionals.id, name: professionals.name, profession: professionals.profession })
      .from(professionals)
      .where(eq(professionals.ownerId, userId)),
  ]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link
          href={`/homes/${homeId}/maintenance`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← היסטוריית תחזוקה
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">רשומת תחזוקה חדשה</h1>
      </div>
      <MaintenanceForm homeId={homeId} items={homeItems} professionals={myProfessionals} />
    </div>
  );
}
