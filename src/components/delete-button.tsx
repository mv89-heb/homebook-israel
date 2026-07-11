"use client";

import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}

export function DeleteButton({ action, confirmMessage, label = "מחיקה" }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger">
        {label}
      </Button>
    </form>
  );
}
