"use client";

import { useActionState } from "react";
import { createHome, updateHome, type HomeActionState } from "@/lib/actions/homes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import type { Home } from "@/db/schema";

const initialState: HomeActionState = { error: null };

interface HomeFormProps {
  home?: Pick<Home, "id" | "name" | "address" | "city">;
}

export function HomeForm({ home }: HomeFormProps) {
  const action = home ? updateHome.bind(null, home.id) : createHome;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

      <Input label="שם הבית" name="name" type="text" defaultValue={home?.name} required />
      <Input label="כתובת" name="address" type="text" defaultValue={home?.address ?? ""} />
      <Input label="עיר" name="city" type="text" defaultValue={home?.city ?? ""} />

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        {home ? "שמירת שינויים" : "יצירת בית"}
      </Button>
    </form>
  );
}
