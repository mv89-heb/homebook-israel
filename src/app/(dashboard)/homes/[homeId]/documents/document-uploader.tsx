"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestDocumentUpload,
  confirmDocumentUpload,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import type { DocumentType } from "@/db/schema";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

const TYPE_LABELS: Record<DocumentType, string> = {
  receipt: "קבלה",
  warranty: "אחריות",
  manual: "מדריך",
  other: "אחר",
};

interface DocumentUploaderProps {
  homeId: string;
  items: { id: string; name: string }[];
}

export function DocumentUploader({ homeId, items }: DocumentUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("receipt");
  const [itemId, setItemId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("נא לבחור קובץ.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("הקובץ גדול מדי (מקסימום 20MB).");
      return;
    }

    startTransition(async () => {
      const requestResult = await requestDocumentUpload(
        homeId,
        file.name,
        file.type,
        itemId || undefined
      );

      if (requestResult.error || !requestResult.uploadUrl || !requestResult.objectKey) {
        setError(requestResult.error ?? "שגיאה בבקשת ההעלאה.");
        return;
      }

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(requestResult.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        setError("העלאת הקובץ נכשלה. בדקו את חיבור הרשת ונסו שוב.");
        return;
      }

      if (!uploadResponse.ok) {
        setError("העלאת הקובץ נכשלה. נסו שוב.");
        return;
      }

      const confirmResult = await confirmDocumentUpload(
        homeId,
        requestResult.objectKey,
        file.name,
        docType,
        itemId || null
      );

      if (confirmResult.error) {
        setError(confirmResult.error);
        return;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5"
    >
      {error && <FormAlert variant="error">{error}</FormAlert>}

      <div className="flex flex-col gap-1.5 text-start">
        <label htmlFor="doc-file" className="text-sm font-medium text-neutral-700">
          קובץ (תמונה או PDF, עד 20MB)
        </label>
        <input
          ref={fileInputRef}
          id="doc-file"
          type="file"
          accept={ACCEPTED_TYPES}
          className="text-sm text-neutral-600 file:me-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-neutral-900 hover:file:bg-neutral-200"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 text-start">
          <label htmlFor="doc-type" className="text-sm font-medium text-neutral-700">
            סוג מסמך
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(event) => setDocType(event.target.value as DocumentType)}
            className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-1.5 text-start">
            <label htmlFor="doc-item" className="text-sm font-medium text-neutral-700">
              שיוך לפריט (אופציונלי)
            </label>
            <select
              id="doc-item"
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
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
      </div>

      <Button type="submit" isLoading={isPending} className="w-fit">
        העלאת מסמך
      </Button>
    </form>
  );
}
