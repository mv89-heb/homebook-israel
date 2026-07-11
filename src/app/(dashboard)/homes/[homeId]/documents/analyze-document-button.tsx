"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AnalyzeDocumentButtonProps {
  documentId: string;
}

export function AnalyzeDocumentButton({ documentId }: AnalyzeDocumentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });
        const body = await response.json();

        if (!response.ok) {
          setError(body.error ?? "ניתוח המסמך נכשל.");
          return;
        }

        router.refresh();
      } catch {
        setError("ניתוח המסמך נכשל. בדקו את חיבור הרשת.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        isLoading={isPending}
        className="!px-3 !py-1.5 text-xs"
      >
        ✨ ניתוח AI
      </Button>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
