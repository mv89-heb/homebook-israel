"use client";

import { useActionState } from "react";
import {
  createMaintenance,
  updateMaintenance,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/form-alert";
import type { Maintenance } from "@/db/schema";

const initialState: MaintenanceActionState = { error: null };

interface MaintenanceFormProps {
  homeId: string;
  items: { id: string; name: string }[];
  professionals: { id: string; name: string; profession: string }[];
  record?: Pick<
    Maintenance,
    "id" | "itemId" | "professionalId" | "description" | "cost" | "performedAt"
  >;
}

export function MaintenanceForm({ homeId, items, professionals, record }: MaintenanceFormProps) {
  const action = record
    ? updateMaintenance.bind(null, record.id, homeId)
    : createMaintenance.bind(null, homeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

      <Textarea
        label="תיאור העבודה"
        name="description"
        defaultValue={record?.description}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="תאריך ביצוע"
          name="performedAt"
          type="date"
          defaultValue={record?.performedAt ?? new Date().toISOString().slice(0, 10)}
        />
        <Input
          label="עלות (₪)"
          name="cost"
          type="number"
          step="0.01"
          min="0"
          defaultValue={record?.cost ?? ""}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 text-start">
          <label htmlFor="itemId" className="text-sm font-medium text-neutral-700">
            פריט קשור (אופציונלי)
          </label>
          <select
            id="itemId"
            name="itemId"
            defaultValue={record?.itemId ?? ""}
            className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">— ללא —</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {professionals.length > 0 && (
        <div className="flex flex-col gap-1.5 text-start">
          <label htmlFor="professionalId" className="text-sm font-medium text-neutral-700">
            בעל מקצוע (אופציונלי)
          </label>
          <select
            id="professionalId"
            name="professionalId"
            defaultValue={record?.professionalId ?? ""}
            className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">— ללא —</option>
            {professionals.map((pro) => (
              <option key={pro.id} value={pro.id}>
                {pro.name} ({pro.profession})
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        {record ? "שמירת שינויים" : "הוספת רשומת תחזוקה"}
      </Button>
    </form>
  );
}
