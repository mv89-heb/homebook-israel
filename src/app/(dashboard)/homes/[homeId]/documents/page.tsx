import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents, items, type DocumentType } from "@/db/schema";
import { getOwnedHome } from "@/lib/db/ownership";
import { createDownloadUrl, isStorageConfigured } from "@/lib/storage/r2";
import { deleteDocument } from "@/lib/actions/documents";
import { isGeminiConfigured } from "@/services/gemini";
import { DeleteButton } from "@/components/delete-button";
import { FormAlert } from "@/components/ui/form-alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentUploader } from "./document-uploader";
import { AnalyzeDocumentButton } from "./analyze-document-button";

const TYPE_LABELS: Record<DocumentType, string> = {
  receipt: "קבלה",
  warranty: "אחריות",
  manual: "מדריך",
  other: "אחר",
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

function isImage(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function readExtractedField(
  data: Record<string, unknown> | null,
  field: string
): string | null {
  if (!data) return null;
  const value = data[field];
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? String(value) : String(value);
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const home = await getOwnedHome(homeId, session!.user.id);

  if (!home) {
    notFound();
  }

  const homeItems = await db
    .select({ id: items.id, name: items.name })
    .from(items)
    .where(eq(items.homeId, homeId))
    .orderBy(items.name);

  const homeDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.homeId, homeId))
    .orderBy(documents.uploadedAt);

  const storageReady = isStorageConfigured();
  const geminiReady = isGeminiConfigured();

  const documentsWithUrls = storageReady
    ? await Promise.all(
        homeDocuments.map(async (doc) => ({
          ...doc,
          previewUrl: await createDownloadUrl(doc.fileUrl).catch(() => null),
        }))
      )
    : homeDocuments.map((doc) => ({ ...doc, previewUrl: null as string | null }));

  const itemNameById = new Map(homeItems.map((item) => [item.id, item.name]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/homes/${homeId}`} className="text-sm text-neutral-500 hover:underline">
          ← {home.name}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">מסמכים</h1>
        <p className="mt-1 text-neutral-500">קבלות, תעודות אחריות ומדריכים</p>
      </div>

      {!storageReady && (
        <FormAlert variant="info">
          אחסון הקבצים עדיין לא מוגדר — יש להזין את פרטי Cloudflare R2 בקובץ .env.local (ראו README) כדי
          להעלות ולצפות במסמכים.
        </FormAlert>
      )}

      {storageReady && !geminiReady && (
        <FormAlert variant="info">
          ניתוח AI אוטומטי עדיין לא מוגדר — יש להזין GEMINI_API_KEY בקובץ .env.local (ראו README) כדי
          לחלץ פרטים אוטומטית מקבלות ותעודות אחריות.
        </FormAlert>
      )}

      <DocumentUploader homeId={homeId} items={homeItems} />

      {documentsWithUrls.length === 0 ? (
        <EmptyState icon="📄" title="עדיין לא הועלו מסמכים" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentsWithUrls.map((doc) => (
            <Card key={doc.id} className="flex flex-col gap-3 !p-4">
              {doc.previewUrl && isImage(doc.fileName) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.previewUrl}
                  alt={doc.fileName}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-lg bg-neutral-100 text-4xl">
                  📄
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="truncate text-sm font-medium text-neutral-900">
                  {doc.fileName}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge>{TYPE_LABELS[doc.type]}</Badge>
                  {doc.itemId && itemNameById.has(doc.itemId) && (
                    <Badge variant="brand">{itemNameById.get(doc.itemId)}</Badge>
                  )}
                </div>
              </div>

              {doc.extractedData ? (
                <div className="flex flex-col gap-1 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                  {readExtractedField(doc.extractedData, "vendorName") && (
                    <span>🏪 {readExtractedField(doc.extractedData, "vendorName")}</span>
                  )}
                  {readExtractedField(doc.extractedData, "totalAmount") && (
                    <span>
                      💰 ₪{readExtractedField(doc.extractedData, "totalAmount")}
                      {readExtractedField(doc.extractedData, "purchaseDate") &&
                        ` · ${readExtractedField(doc.extractedData, "purchaseDate")}`}
                    </span>
                  )}
                  {readExtractedField(doc.extractedData, "warrantyExpiresAt") && (
                    <span>
                      🛡️ אחריות עד {readExtractedField(doc.extractedData, "warrantyExpiresAt")}
                    </span>
                  )}
                  {readExtractedField(doc.extractedData, "summary") && (
                    <span className="text-brand-700">
                      {readExtractedField(doc.extractedData, "summary")}
                    </span>
                  )}
                </div>
              ) : (
                geminiReady && <AnalyzeDocumentButton documentId={doc.id} />
              )}

              <div className="flex items-center justify-between gap-2">
                {doc.previewUrl ? (
                  <a
                    href={doc.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    פתיחה
                  </a>
                ) : (
                  <span className="text-sm text-neutral-400">לא זמין</span>
                )}
                <DeleteButton
                  action={deleteDocument.bind(null, doc.id, homeId)}
                  confirmMessage={`למחוק את "${doc.fileName}"?`}
                  label="מחיקה"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
