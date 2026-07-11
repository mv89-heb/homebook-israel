import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedHome } from "@/lib/db/ownership";
import { RoomForm } from "../room-form";

export default async function NewRoomPage({
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

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link href={`/homes/${homeId}`} className="text-sm text-neutral-500 hover:underline">
          ← {home.name}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">חדר חדש</h1>
      </div>
      <RoomForm homeId={homeId} />
    </div>
  );
}
