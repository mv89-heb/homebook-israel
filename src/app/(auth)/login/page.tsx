"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-neutral-900">התחברות</h1>
        <p className="mt-1 text-sm text-neutral-500">שמחים לראות אתכם שוב</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

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
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        <Button type="submit" isLoading={isPending} className="mt-2 w-full">
          התחברות
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        עדיין אין לכם חשבון?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
