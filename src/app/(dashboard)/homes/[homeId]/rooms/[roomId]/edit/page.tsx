import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedHome, getOwnedRoomInHome } from "@/lib/db/ownership";
import { RoomForm } from "../../room-form";

export default async function EditRoomPage({
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
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">עריכת חדר</h1>
      </div>
      <RoomForm homeId={homeId} room={room} />
    </div>
  );
}
