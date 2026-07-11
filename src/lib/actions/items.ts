"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getOwnedItem, getOwnedRoomInHome } from "@/lib/db/ownership";

export interface ItemActionState {
  error: string | null;
}

function parseOptionalDecimal(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? str : null;
}

function parseOptionalDate(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function createItem(
  roomId: string,
  homeId: string,
  _prevState: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const room = await getOwnedRoomInHome(roomId, homeId, session.user.id);
  if (!room) {
    return { error: "החדר לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "נא להזין שם לפריט." };
  }

  const category = String(formData.get("category") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const purchaseDate = parseOptionalDate(formData.get("purchaseDate"));
  const warrantyExpiresAt = parseOptionalDate(formData.get("warrantyExpiresAt"));
  const purchasePrice = parseOptionalDecimal(formData.get("purchasePrice"));

  const [item] = await db
    .insert(items)
    .values({
      roomId,
      // homeId is overwritten by the DB trigger regardless — passed here
      // only to satisfy the NOT NULL column before the trigger fires.
      homeId,
      name,
      category,
      brand,
      model,
      notes,
      purchaseDate,
      warrantyExpiresAt,
      purchasePrice,
    })
    .returning({ id: items.id });

  revalidatePath(`/homes/${homeId}/rooms/${roomId}`);
  redirect(`/homes/${homeId}/rooms/${roomId}/items/${item.id}`);
}

export async function updateItem(
  itemId: string,
  roomId: string,
  homeId: string,
  _prevState: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const owned = await getOwnedItem(itemId, session.user.id);
  if (!owned) {
    return { error: "הפריט לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "נא להזין שם לפריט." };
  }

  const category = String(formData.get("category") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const purchaseDate = parseOptionalDate(formData.get("purchaseDate"));
  const warrantyExpiresAt = parseOptionalDate(formData.get("warrantyExpiresAt"));
  const purchasePrice = parseOptionalDecimal(formData.get("purchasePrice"));

  await db
    .update(items)
    .set({
      name,
      category,
      brand,
      model,
      notes,
      purchaseDate,
      warrantyExpiresAt,
      purchasePrice,
      updatedAt: new Date(),
    })
    .where(eq(items.id, itemId));

  revalidatePath(`/homes/${homeId}/rooms/${roomId}`);
  revalidatePath(`/homes/${homeId}/rooms/${roomId}/items/${itemId}`);
  return { error: null };
}

export async function deleteItem(itemId: string, roomId: string, homeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const owned = await getOwnedItem(itemId, session.user.id);
  if (!owned) {
    redirect(`/homes/${homeId}/rooms/${roomId}`);
  }

  await db.delete(items).where(eq(items.id, itemId));

  revalidatePath(`/homes/${homeId}/rooms/${roomId}`);
  redirect(`/homes/${homeId}/rooms/${roomId}`);
}
