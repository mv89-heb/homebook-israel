import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getOwnedHome, getOwnedRoomInHome } from "@/lib/db/ownership";
import { deleteRoom } from "@/lib/actions/rooms";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { CardLink } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function warrantyBadge(warrantyExpiresAt: string | null) {
  if (!warrantyExpiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(warrantyExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <Badge variant="danger">אחריות פגה</Badge>;
  if (daysLeft <= 30) return <Badge variant="accent">אחריות מסתיימת בקרוב</Badge>;
  return <Badge variant="success">באחריות</Badge>;
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; roomId: string }>;
}) {
  const { homeId, roomId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const home = await getOwnedHome(homeId, userId);
  if (!home) {
    notFound();
  }

  const room = await getOwnedRoomInHome(roomId, homeId, userId);
  if (!room) {
    notFound();
  }

  const roomItems = await db
    .select()
    .from(items)
    .where(eq(items.roomId, roomId))
    .orderBy(items.createdAt);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <Link href={`/homes/${homeId}`} className="text-sm text-neutral-500 hover:underline">
            ← {home.name}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-medium text-neutral-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-lg">
              {room.icon || "🚪"}
            </span>
            {room.name}
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/homes/${homeId}/rooms/${roomId}/edit`}>
            <Button variant="secondary">עריכה</Button>
          </Link>
          <DeleteButton
            action={deleteRoom.bind(null, roomId, homeId)}
            confirmMessage={`למחוק את "${room.name}"? כל הפריטים בחדר זה יימחקו לצמיתות.`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {roomItems.length === 0
              ? "אין עדיין פריטים"
              : `${roomItems.length} ${roomItems.length === 1 ? "פריט" : "פריטים"}`}
          </h2>
          <Link href={`/homes/${homeId}/rooms/${roomId}/items/new`}>
            <Button variant="secondary">+ הוספת פריט</Button>
          </Link>
        </div>

        {roomItems.length === 0 ? (
          <EmptyState
            icon="📦"
            title="אין עדיין פריטים"
            description="הוסיפו פריט ראשון לחדר הזה"
            action={
              <Link href={`/homes/${homeId}/rooms/${roomId}/items/new`}>
                <Button>הוספת פריט</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomItems.map((item) => (
              <CardLink
                key={item.id}
                href={`/homes/${homeId}/rooms/${roomId}/items/${item.id}`}
                className="flex flex-col gap-1.5"
              >
                <span className="font-semibold text-neutral-900">{item.name}</span>
                {(item.brand || item.model) && (
                  <span className="text-sm text-neutral-500">
                    {[item.brand, item.model].filter(Boolean).join(" · ")}
                  </span>
                )}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {item.category && <Badge>{item.category}</Badge>}
                  {warrantyBadge(item.warrantyExpiresAt)}
                </div>
              </CardLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
