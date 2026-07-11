import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { rooms, items } from "@/db/schema";
import { getOwnedHome } from "@/lib/db/ownership";
import { deleteHome } from "@/lib/actions/homes";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { CardLink } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const home = await getOwnedHome(homeId, session!.user.id);

  if (!home) {
    notFound();
  }

  const [homeRooms, itemCounts] = await Promise.all([
    db.select().from(rooms).where(eq(rooms.homeId, homeId)).orderBy(rooms.createdAt),
    db
      .select({ roomId: items.roomId, value: count() })
      .from(items)
      .where(eq(items.homeId, homeId))
      .groupBy(items.roomId),
  ]);

  const itemCountByRoom = new Map(itemCounts.map((row) => [row.roomId, row.value]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            ← לוח הבקרה
          </Link>
          <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">{home.name}</h1>
          {(home.address || home.city) && (
            <p className="mt-1 text-neutral-500">
              {[home.address, home.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/homes/${home.id}/maintenance`}>
            <Button variant="secondary">תחזוקה</Button>
          </Link>
          <Link href={`/homes/${home.id}/documents`}>
            <Button variant="secondary">מסמכים</Button>
          </Link>
          <Link href={`/homes/${home.id}/edit`}>
            <Button variant="secondary">עריכה</Button>
          </Link>
          <DeleteButton
            action={deleteHome.bind(null, home.id)}
            confirmMessage={`למחוק את "${home.name}"? כל החדרים והפריטים בבית זה יימחקו לצמיתות.`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {homeRooms.length === 0
              ? "אין עדיין חדרים"
              : `${homeRooms.length} ${homeRooms.length === 1 ? "חדר" : "חדרים"}`}
          </h2>
          <Link href={`/homes/${home.id}/rooms/new`}>
            <Button variant="secondary">+ הוספת חדר</Button>
          </Link>
        </div>

        {homeRooms.length === 0 ? (
          <EmptyState
            icon="🛋️"
            title="אין עדיין חדרים"
            description="הוסיפו חדר ראשון כדי להתחיל להוסיף פריטים"
            action={
              <Link href={`/homes/${home.id}/rooms/new`}>
                <Button>הוספת חדר</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {homeRooms.map((room) => {
              const itemCount = itemCountByRoom.get(room.id) ?? 0;
              return (
                <CardLink
                  key={room.id}
                  href={`/homes/${home.id}/rooms/${room.id}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl">
                    {room.icon || "🚪"}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-900">{room.name}</span>
                    <span className="text-sm text-neutral-500">
                      {itemCount === 0 ? "אין פריטים" : `${itemCount} פריטים`}
                    </span>
                  </div>
                </CardLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
