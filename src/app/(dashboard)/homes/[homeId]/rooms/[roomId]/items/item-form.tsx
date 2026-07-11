"use client";

import { useActionState } from "react";
import { createItem, updateItem, type ItemActionState } from "@/lib/actions/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/form-alert";
import type { Item } from "@/db/schema";

const initialState: ItemActionState = { error: null };

const CATEGORY_OPTIONS = [
  "מכשיר חשמלי",
  "ריהוט",
  "אלקטרוניקה",
  "כלי מטבח",
  "כלי עבודה",
  "אחר",
];

interface ItemFormProps {
  homeId: string;
  roomId: string;
  item?: Pick<
    Item,
    | "id"
    | "name"
    | "category"
    | "brand"
    | "model"
    | "notes"
    | "purchaseDate"
    | "warrantyExpiresAt"
    | "purchasePrice"
  >;
}

export function ItemForm({ homeId, roomId, item }: ItemFormProps) {
  const action = item
    ? updateItem.bind(null, item.id, roomId, homeId)
    : createItem.bind(null, roomId, homeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

      <Input label="שם הפריט" name="name" type="text" defaultValue={item?.name} required />

      <div className="flex flex-col gap-1.5 text-start">
        <label htmlFor="category" className="text-sm font-medium text-neutral-700">
          קטגוריה
        </label>
        <select
          id="category"
          name="category"
          defaultValue={item?.category ?? ""}
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">— ללא —</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="מותג" name="brand" type="text" defaultValue={item?.brand ?? ""} />
        <Input label="דגם" name="model" type="text" defaultValue={item?.model ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="תאריך רכישה"
          name="purchaseDate"
          type="date"
          defaultValue={item?.purchaseDate ?? ""}
        />
        <Input
          label="מחיר רכישה (₪)"
          name="purchasePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item?.purchasePrice ?? ""}
        />
      </div>

      <Input
        label="תוקף אחריות"
        name="warrantyExpiresAt"
        type="date"
        defaultValue={item?.warrantyExpiresAt ?? ""}
      />

      <Textarea label="הערות" name="notes" defaultValue={item?.notes ?? ""} />

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        {item ? "שמירת שינויים" : "יצירת פריט"}
      </Button>
    </form>
  );
}
