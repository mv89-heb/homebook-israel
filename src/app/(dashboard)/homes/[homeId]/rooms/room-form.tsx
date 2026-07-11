"use client";

import { useActionState, useState } from "react";
import { createRoom, updateRoom, type RoomActionState } from "@/lib/actions/rooms";
import { ROOM_ICONS } from "@/lib/constants/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import type { Room } from "@/db/schema";

const initialState: RoomActionState = { error: null };

interface RoomFormProps {
  homeId: string;
  room?: Pick<Room, "id" | "name" | "icon">;
}

export function RoomForm({ homeId, room }: RoomFormProps) {
  const action = room
    ? updateRoom.bind(null, room.id, homeId)
    : createRoom.bind(null, homeId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedIcon, setSelectedIcon] = useState(room?.icon ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <FormAlert variant="error">{state.error}</FormAlert>}

      <Input label="שם החדר" name="name" type="text" defaultValue={room?.name} required />

      <input type="hidden" name="icon" value={selectedIcon} />
      <div className="flex flex-col gap-1.5 text-start">
        <span className="text-sm font-medium text-neutral-700">סמל (אופציונלי)</span>
        <div className="flex flex-wrap gap-2">
          {ROOM_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon === selectedIcon ? "" : icon)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                selectedIcon === icon
                  ? "border-brand-500 bg-brand-50"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              }`}
              aria-pressed={selectedIcon === icon}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={isPending} className="mt-2 w-fit">
        {room ? "שמירת שינויים" : "יצירת חדר"}
      </Button>
    </form>
  );
}
