import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedHome, getOwnedRoomInHome } from "@/lib/db/ownership";
import { ItemForm } from "../item-form";

export default async function NewItemPage({
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

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link
          href={`/homes/${homeId}/rooms/${roomId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {room.name}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">פריט חדש</h1>
      </div>
      <ItemForm homeId={homeId} roomId={roomId} />
    </div>
  );
}
