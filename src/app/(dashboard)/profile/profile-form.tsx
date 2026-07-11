"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";

const initialState: ProfileActionState = { error: null, success: false };

interface ProfileFormProps {
  email: string;
  fullName: string | null;
  phone: string | null;
}

export function ProfileForm({ email, fullName, phone }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}
      {state.success && <FormAlert variant="success">הפרופיל עודכן בהצלחה.</FormAlert>}

      <Input label="אימייל" name="email" type="email" value={email} disabled readOnly />
      <Input
        label="שם מלא"
        name="fullName"
        type="text"
        defaultValue={fullName ?? ""}
        required
      />
      <Input label="טלפון" name="phone" type="tel" defaultValue={phone ?? ""} />

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        שמירת שינויים
      </Button>
    </form>
  );
}
