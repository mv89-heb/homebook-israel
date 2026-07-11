"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";

const initialState: AuthActionState = { error: null };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-neutral-900">הרשמה</h1>
        <p className="mt-1 text-sm text-neutral-500">צרו חשבון חדש ב-HomeBook Israel</p>
      </div>

      {state.info ? (
        <FormAlert variant="success">{state.info}</FormAlert>
      ) : (
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

          <Input label="שם מלא" name="fullName" type="text" autoComplete="name" required />
          <Input
            label="אימייל"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <Input
            label="סיסמה"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="לפחות 6 תווים"
            required
            minLength={6}
          />
          <Input
            label="אימות סיסמה"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <Button type="submit" isLoading={isPending} className="mt-2 w-full">
            הרשמה
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-neutral-500">
        כבר יש לכם חשבון?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          התחברות
        </Link>
      </p>
    </div>
  );
}
