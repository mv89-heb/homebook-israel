import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { maintenance, items, professionals } from "@/db/schema";
import { getOwnedHome } from "@/lib/db/ownership";
import { deleteMaintenance } from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MaintenanceForm } from "./maintenance-form";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("he-IL");
}

function formatCost(value: string | null): string | null {
  if (!value) return null;
  return `₪${Number(value).toLocaleString("he-IL")}`;
}

export default async function MaintenancePage({
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

  const [records, homeItems, myProfessionals] = await Promise.all([
    db
      .select({
        id: maintenance.id,
        description: maintenance.description,
        cost: maintenance.cost,
        performedAt: maintenance.performedAt,
        itemName: items.name,
        professionalName: professionals.name,
      })
      .from(maintenance)
      .leftJoin(items, eq(items.id, maintenance.itemId))
      .leftJoin(professionals, eq(professionals.id, maintenance.professionalId))
      .where(eq(maintenance.homeId, homeId))
      .orderBy(desc(maintenance.performedAt)),
    db.select({ id: items.id, name: items.name }).from(items).where(eq(items.homeId, homeId)),
    db
      .select({ id: professionals.id, name: professionals.name, profession: professionals.profession })
      .from(professionals)
      .where(eq(professionals.ownerId, userId)),
  ]);

  const totalCost = records.reduce((sum, r) => sum + (r.cost ? Number(r.cost) : 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/homes/${homeId}`} className="text-sm text-neutral-500 hover:underline">
          ← {home.name}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">היסטוריית תחזוקה</h1>
        {totalCost > 0 && (
          <p className="mt-1 text-neutral-500">
            סה&quot;כ הוצאות: <span className="font-medium">₪{totalCost.toLocaleString("he-IL")}</span>
          </p>
        )}
      </div>

      <Card className="flex max-w-lg flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">הוספת רשומה</h2>
        <MaintenanceForm homeId={homeId} items={homeItems} professionals={myProfessionals} />
      </Card>

      {records.length === 0 ? (
        <EmptyState icon="🔧" title="אין עדיין רשומות תחזוקה" />
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((record) => (
            <Card key={record.id} className="flex items-start justify-between gap-4 !p-4">
              <div className="flex flex-col gap-1">
                <p className="text-neutral-900">{record.description}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-neutral-500">{formatDate(record.performedAt)}</span>
                  {record.itemName && <Badge>{record.itemName}</Badge>}
                  {record.professionalName && <Badge variant="brand">{record.professionalName}</Badge>}
                  {formatCost(record.cost) && (
                    <span className="text-xs font-medium text-neutral-700">
                      {formatCost(record.cost)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/homes/${homeId}/maintenance/${record.id}/edit`}>
                  <Button variant="secondary" className="!px-3 !py-1.5 text-sm">
                    עריכה
                  </Button>
                </Link>
                <DeleteButton
                  action={deleteMaintenance.bind(null, record.id, homeId)}
                  confirmMessage="למחוק את הרשומה הזו?"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
