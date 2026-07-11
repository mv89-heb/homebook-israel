"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { homes } from "@/db/schema";
import { getOwnedHome } from "@/lib/db/ownership";

export interface HomeActionState {
  error: string | null;
}

export async function createHome(
  _prevState: HomeActionState,
  formData: FormData
): Promise<HomeActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (name.length < 2) {
    return { error: "נא להזין שם לבית." };
  }

  const [home] = await db
    .insert(homes)
    .values({
      ownerId: session.user.id,
      name,
      address: address || null,
      city: city || null,
    })
    .returning({ id: homes.id });

  revalidatePath("/dashboard");
  redirect(`/homes/${home.id}`);
}

export async function updateHome(
  homeId: string,
  _prevState: HomeActionState,
  formData: FormData
): Promise<HomeActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const owned = await getOwnedHome(homeId, session.user.id);
  if (!owned) {
    return { error: "הבית לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (name.length < 2) {
    return { error: "נא להזין שם לבית." };
  }

  await db
    .update(homes)
    .set({ name, address: address || null, city: city || null, updatedAt: new Date() })
    .where(eq(homes.id, homeId));

  revalidatePath("/dashboard");
  revalidatePath(`/homes/${homeId}`);
  return { error: null };
}

export async function deleteHome(homeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const owned = await getOwnedHome(homeId, session.user.id);
  if (!owned) {
    redirect("/dashboard");
  }

  // ON DELETE CASCADE on rooms/items/documents/maintenance/reminders
  // (all reference homes.id) takes care of everything underneath.
  await db.delete(homes).where(eq(homes.id, homeId));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
