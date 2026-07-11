"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";

export interface ProfileActionState {
  error: string | null;
  success: boolean;
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "נא להזין שם מלא.", success: false };
  }
  if (!isDatabaseConfigured()) {
    return { error: "החיבור למסד הנתונים עדיין לא מוגדר.", success: false };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש.", success: false };
  }

  await db
    .update(users)
    .set({ fullName, phone: phone || null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
