"use client";

import { useActionState } from "react";
import {
  createProfessional,
  updateProfessional,
  type ProfessionalActionState,
} from "@/lib/actions/professionals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/form-alert";
import type { Professional } from "@/db/schema";

const initialState: ProfessionalActionState = { error: null };

interface ProfessionalFormProps {
  professional?: Pick<
    Professional,
    "id" | "name" | "profession" | "phone" | "rating" | "notes"
  >;
}

export function ProfessionalForm({ professional }: ProfessionalFormProps) {
  const action = professional
    ? updateProfessional.bind(null, professional.id)
    : createProfessional;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

      <Input label="שם" name="name" type="text" defaultValue={professional?.name} required />
      <Input
        label="תחום עיסוק"
        name="profession"
        type="text"
        placeholder="חשמלאי, אינסטלטור, טכנאי מזגנים..."
        defaultValue={professional?.profession}
        required
      />
      <Input label="טלפון" name="phone" type="tel" defaultValue={professional?.phone ?? ""} />

      <div className="flex flex-col gap-1.5 text-start">
        <label htmlFor="rating" className="text-sm font-medium text-neutral-700">
          דירוג (0–5)
        </label>
        <select
          id="rating"
          name="rating"
          defaultValue={professional?.rating ?? ""}
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">— ללא דירוג —</option>
          {["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"].map((value) => (
            <option key={value} value={value}>
              {"⭐".repeat(Math.round(Number(value)))} ({value})
            </option>
          ))}
        </select>
      </div>

      <Textarea label="הערות" name="notes" defaultValue={professional?.notes ?? ""} />

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        {professional ? "שמירת שינויים" : "הוספת בעל מקצוע"}
      </Button>
    </form>
  );
}
