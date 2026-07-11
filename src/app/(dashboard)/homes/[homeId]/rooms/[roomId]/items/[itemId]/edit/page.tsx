import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedHome, getOwnedItem, getOwnedRoomInHome } from "@/lib/db/ownership";
import { ItemForm } from "../../item-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ homeId: string; roomId: string; itemId: string }>;
}) {
  const { homeId, roomId, itemId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const home = await getOwnedHome(homeId, userId);
  if (!home) notFound();

  const room = await getOwnedRoomInHome(roomId, homeId, userId);
  if (!room) notFound();

  const item = await getOwnedItem(itemId, userId);
  if (!item || item.roomId !== roomId) notFound();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link
          href={`/homes/${homeId}/rooms/${roomId}/items/${itemId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {item.name}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">עריכת פריט</h1>
      </div>
      <ItemForm homeId={homeId} roomId={roomId} item={item} />
    </div>
  );
}
