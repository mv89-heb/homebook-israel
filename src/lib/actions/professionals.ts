"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { professionals } from "@/db/schema";
import { getOwnedProfessional } from "@/lib/db/ownership";

export interface ProfessionalActionState {
  error: string | null;
}

function parseRating(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < 0 || num > 5) return null;
  return str;
}

export async function createProfessional(
  _prevState: ProfessionalActionState,
  formData: FormData
): Promise<ProfessionalActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rating = parseRating(formData.get("rating"));

  if (name.length < 2) {
    return { error: "נא להזין שם." };
  }
  if (profession.length < 2) {
    return { error: "נא להזין תחום עיסוק." };
  }

  await db.insert(professionals).values({
    ownerId: session.user.id,
    name,
    profession,
    phone: phone || null,
    notes: notes || null,
    rating,
  });

  revalidatePath("/professionals");
  redirect("/professionals");
}

export async function updateProfessional(
  professionalId: string,
  _prevState: ProfessionalActionState,
  formData: FormData
): Promise<ProfessionalActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const owned = await getOwnedProfessional(professionalId, session.user.id);
  if (!owned) {
    return { error: "בעל המקצוע לא נמצא." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rating = parseRating(formData.get("rating"));

  if (name.length < 2) {
    return { error: "נא להזין שם." };
  }
  if (profession.length < 2) {
    return { error: "נא להזין תחום עיסוק." };
  }

  await db
    .update(professionals)
    .set({
      name,
      profession,
      phone: phone || null,
      notes: notes || null,
      rating,
      updatedAt: new Date(),
    })
    .where(eq(professionals.id, professionalId));

  revalidatePath("/professionals");
  return { error: null };
}

export async function deleteProfessional(professionalId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const owned = await getOwnedProfessional(professionalId, session.user.id);
  if (!owned) {
    redirect("/professionals");
  }

  // maintenance.professional_id references this row with ON DELETE SET NULL,
  // so existing maintenance history is preserved (just loses the linked pro).
  await db.delete(professionals).where(eq(professionals.id, professionalId));

  revalidatePath("/professionals");
  redirect("/professionals");
}
