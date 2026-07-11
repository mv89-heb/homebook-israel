"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export interface AuthActionState {
  error: string | null;
  info?: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NOT_CONFIGURED_MESSAGE =
  "החיבור למסד הנתונים עדיין לא מוגדר. יש להזין DATABASE_URL (Neon) בקובץ .env.local (ראו README).";

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "כתובת אימייל לא תקינה." };
  }
  if (password.length === 0) {
    return { error: "נא להזין סיסמה." };
  }
  if (!isDatabaseConfigured()) {
    return { error: NOT_CONFIGURED_MESSAGE };
  }

  try {
    await authSignIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "אימייל או סיסמה שגויים." };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (fullName.length < 2) {
    return { error: "נא להזין שם מלא." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "כתובת אימייל לא תקינה." };
  }
  if (password.length < 6) {
    return { error: "הסיסמה חייבת להכיל לפחות 6 תווים." };
  }
  if (password !== confirmPassword) {
    return { error: "הסיסמאות אינן תואמות." };
  }
  if (!isDatabaseConfigured()) {
    return { error: NOT_CONFIGURED_MESSAGE };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "כבר קיים משתמש עם כתובת אימייל זו." };
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ email, passwordHash, fullName });

  try {
    await authSignIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created but auto sign-in failed for some reason —
      // send them to log in manually instead of leaving them stuck.
      return {
        error: null,
        info: "נרשמת בהצלחה! ניתן כעת להתחבר עם הפרטים שהזנתם.",
      };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await authSignOut({ redirect: false });
  redirect("/login");
}
