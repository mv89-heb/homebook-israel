"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { getOwnedHome, getOwnedRoom } from "@/lib/db/ownership";
import { ROOM_ICONS } from "@/lib/constants/rooms";

export interface RoomActionState {
  error: string | null;
}

export async function createRoom(
  homeId: string,
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const home = await getOwnedHome(homeId, session.user.id);
  if (!home) {
    return { error: "הבית לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (name.length < 2) {
    return { error: "נא להזין שם לחדר." };
  }

  const [room] = await db
    .insert(rooms)
    .values({
      homeId,
      name,
      icon: ROOM_ICONS.includes(icon as (typeof ROOM_ICONS)[number]) ? icon : null,
    })
    .returning({ id: rooms.id });

  revalidatePath(`/homes/${homeId}`);
  redirect(`/homes/${homeId}/rooms/${room.id}`);
}

export async function updateRoom(
  roomId: string,
  homeId: string,
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const room = await getOwnedRoom(roomId, session.user.id);
  if (!room) {
    return { error: "החדר לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (name.length < 2) {
    return { error: "נא להזין שם לחדר." };
  }

  await db
    .update(rooms)
    .set({
      name,
      icon: ROOM_ICONS.includes(icon as (typeof ROOM_ICONS)[number]) ? icon : null,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, roomId));

  revalidatePath(`/homes/${homeId}`);
  revalidatePath(`/homes/${homeId}/rooms/${roomId}`);
  return { error: null };
}

export async function deleteRoom(roomId: string, homeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const room = await getOwnedRoom(roomId, session.user.id);
  if (!room) {
    redirect(`/homes/${homeId}`);
  }

  // ON DELETE CASCADE on items (references rooms.id) takes care of items
  // inside this room.
  await db.delete(rooms).where(eq(rooms.id, roomId));

  revalidatePath(`/homes/${homeId}`);
  redirect(`/homes/${homeId}`);
}
