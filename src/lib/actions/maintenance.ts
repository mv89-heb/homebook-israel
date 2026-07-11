"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { maintenance } from "@/db/schema";
import { getOwnedHome, getOwnedMaintenanceRecord, getOwnedItem, getOwnedProfessional } from "@/lib/db/ownership";

export interface MaintenanceActionState {
  error: string | null;
}

function parseOptionalDecimal(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? str : null;
}

async function validateRelatedIds(
  userId: string,
  homeId: string,
  itemId: string | null,
  professionalId: string | null
): Promise<string | null> {
  if (itemId) {
    const item = await getOwnedItem(itemId, userId);
    if (!item || item.homeId !== homeId) {
      return "הפריט לא נמצא.";
    }
  }
  if (professionalId) {
    const professional = await getOwnedProfessional(professionalId, userId);
    if (!professional) {
      return "בעל המקצוע לא נמצא.";
    }
  }
  return null;
}

export async function createMaintenance(
  homeId: string,
  _prevState: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const home = await getOwnedHome(homeId, session.user.id);
  if (!home) {
    return { error: "הבית לא נמצא." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 2) {
    return { error: "נא להזין תיאור." };
  }

  const itemId = String(formData.get("itemId") ?? "").trim() || null;
  const professionalId = String(formData.get("professionalId") ?? "").trim() || null;
  const cost = parseOptionalDecimal(formData.get("cost"));
  const performedAtRaw = String(formData.get("performedAt") ?? "").trim();
  const performedAt = performedAtRaw || new Date().toISOString().slice(0, 10);

  const relationError = await validateRelatedIds(session.user.id, homeId, itemId, professionalId);
  if (relationError) {
    return { error: relationError };
  }

  await db.insert(maintenance).values({
    homeId,
    itemId,
    professionalId,
    description,
    cost,
    performedAt,
  });

  revalidatePath(`/homes/${homeId}/maintenance`);
  redirect(`/homes/${homeId}/maintenance`);
}

export async function updateMaintenance(
  maintenanceId: string,
  homeId: string,
  _prevState: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const owned = await getOwnedMaintenanceRecord(maintenanceId, session.user.id);
  if (!owned) {
    return { error: "הרשומה לא נמצאה." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 2) {
    return { error: "נא להזין תיאור." };
  }

  const itemId = String(formData.get("itemId") ?? "").trim() || null;
  const professionalId = String(formData.get("professionalId") ?? "").trim() || null;
  const cost = parseOptionalDecimal(formData.get("cost"));
  const performedAtRaw = String(formData.get("performedAt") ?? "").trim();
  const performedAt = performedAtRaw || new Date().toISOString().slice(0, 10);

  const relationError = await validateRelatedIds(session.user.id, homeId, itemId, professionalId);
  if (relationError) {
    return { error: relationError };
  }

  await db
    .update(maintenance)
    .set({ itemId, professionalId, description, cost, performedAt })
    .where(eq(maintenance.id, maintenanceId));

  revalidatePath(`/homes/${homeId}/maintenance`);
  return { error: null };
}

export async function deleteMaintenance(maintenanceId: string, homeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const owned = await getOwnedMaintenanceRecord(maintenanceId, session.user.id);
  if (!owned) {
    redirect(`/homes/${homeId}/maintenance`);
  }

  await db.delete(maintenance).where(eq(maintenance.id, maintenanceId));

  revalidatePath(`/homes/${homeId}/maintenance`);
  redirect(`/homes/${homeId}/maintenance`);
}
