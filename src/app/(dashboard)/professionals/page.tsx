import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { professionals } from "@/db/schema";
import { deleteProfessional } from "@/lib/actions/professionals";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function renderStars(rating: string | null): string | null {
  if (!rating) return null;
  const num = Math.round(Number(rating));
  return "⭐".repeat(num) || null;
}

export default async function ProfessionalsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const myProfessionals = await db
    .select()
    .from(professionals)
    .where(eq(professionals.ownerId, userId))
    .orderBy(professionals.createdAt);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            ← לוח הבקרה
          </Link>
          <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">בעלי מקצוע</h1>
          <p className="mt-1 text-neutral-500">אנשי הקשר שלכם לתחזוקת הבית</p>
        </div>
        <Link href="/professionals/new">
          <Button variant="secondary">+ הוספת בעל מקצוע</Button>
        </Link>
      </div>

      {myProfessionals.length === 0 ? (
        <EmptyState
          icon="🔧"
          title="עדיין לא הוספתם בעלי מקצוע"
          description="חשמלאים, אינסטלטורים וטכנאים במקום אחד"
          action={
            <Link href="/professionals/new">
              <Button>הוספת בעל מקצוע ראשון</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myProfessionals.map((pro) => (
            <Card key={pro.id} interactive className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-neutral-900">{pro.name}</span>
                  <p className="text-sm text-neutral-500">{pro.profession}</p>
                </div>
                {renderStars(pro.rating) && (
                  <span className="shrink-0 text-sm">{renderStars(pro.rating)}</span>
                )}
              </div>
              {pro.phone && (
                <a href={`tel:${pro.phone}`} className="text-sm text-brand-600 hover:underline">
                  {pro.phone}
                </a>
              )}
              {pro.notes && <p className="text-sm text-neutral-600">{pro.notes}</p>}
              <div className="mt-2 flex gap-2">
                <Link href={`/professionals/${pro.id}/edit`}>
                  <Button variant="secondary" className="!px-3 !py-1.5 text-sm">
                    עריכה
                  </Button>
                </Link>
                <DeleteButton
                  action={deleteProfessional.bind(null, pro.id)}
                  confirmMessage={`למחוק את "${pro.name}"?`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
