import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents, maintenance, professionals } from "@/db/schema";
import { getOwnedHome, getOwnedItem, getOwnedRoomInHome } from "@/lib/db/ownership";
import { createDownloadUrl, isStorageConfigured } from "@/lib/storage/r2";
import { deleteItem } from "@/lib/actions/items";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("he-IL");
}

function formatPrice(value: string | null): string | null {
  if (!value) return null;
  return `₪${Number(value).toLocaleString("he-IL")}`;
}

function warrantyBadge(warrantyExpiresAt: string | null) {
  if (!warrantyExpiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(warrantyExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <Badge variant="danger">אחריות פגה</Badge>;
  if (daysLeft <= 30) return <Badge variant="accent">אחריות מסתיימת בקרוב</Badge>;
  return <Badge variant="success">באחריות</Badge>;
}

const TYPE_LABELS: Record<string, string> = {
  receipt: "קבלה",
  warranty: "אחריות",
  manual: "מדריך",
  other: "אחר",
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; roomId: string; itemId: string }>;
}) {
  const { homeId, roomId, itemId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const home = await getOwnedHome(homeId, userId);
  if (!home) notFound();

  const room = await getOwnedRoomInHome(roomId, homeId, userId);
  if (!room) notFound();

  const item = await getOwnedItem(itemId, userId);
  if (!item || item.roomId !== roomId) notFound();

  const [itemDocuments, itemMaintenance] = await Promise.all([
    db.select().from(documents).where(eq(documents.itemId, itemId)).orderBy(desc(documents.uploadedAt)),
    db
      .select({
        id: maintenance.id,
        description: maintenance.description,
        cost: maintenance.cost,
        performedAt: maintenance.performedAt,
        professionalName: professionals.name,
      })
      .from(maintenance)
      .leftJoin(professionals, eq(professionals.id, maintenance.professionalId))
      .where(eq(maintenance.itemId, itemId))
      .orderBy(desc(maintenance.performedAt)),
  ]);

  const storageReady = isStorageConfigured();
  const documentUrls = storageReady
    ? await Promise.all(itemDocuments.map((doc) => createDownloadUrl(doc.fileUrl).catch(() => null)))
    : itemDocuments.map(() => null);

  const details: { label: string; value: string }[] = [];
  if (item.brand) details.push({ label: "מותג", value: item.brand });
  if (item.model) details.push({ label: "דגם", value: item.model });
  const purchaseDate = formatDate(item.purchaseDate);
  if (purchaseDate) details.push({ label: "תאריך רכישה", value: purchaseDate });
  const purchasePrice = formatPrice(item.purchasePrice);
  if (purchasePrice) details.push({ label: "מחיר רכישה", value: purchasePrice });
  const warrantyExpiresAt = formatDate(item.warrantyExpiresAt);
  if (warrantyExpiresAt) details.push({ label: "תוקף אחריות", value: warrantyExpiresAt });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <Link
            href={`/homes/${homeId}/rooms/${roomId}`}
            className="text-sm text-neutral-500 hover:underline"
          >
            ← {room.name}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-medium text-neutral-900">{item.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.category && <Badge>{item.category}</Badge>}
            {warrantyBadge(item.warrantyExpiresAt)}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/homes/${homeId}/rooms/${roomId}/items/${itemId}/edit`}>
            <Button variant="secondary">עריכה</Button>
          </Link>
          <DeleteButton
            action={deleteItem.bind(null, itemId, roomId, homeId)}
            confirmMessage={`למחוק את "${item.name}"?`}
          />
        </div>
      </div>

      {details.length > 0 && (
        <Card>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex flex-col gap-1">
                <dt className="text-sm text-neutral-500">{detail.label}</dt>
                <dd className="text-neutral-900">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {item.notes && (
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">הערות</span>
          <p className="whitespace-pre-wrap text-neutral-900">{item.notes}</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">מסמכים</h2>
        {itemDocuments.length === 0 ? (
          <p className="text-sm text-neutral-500">אין מסמכים המשויכים לפריט זה</p>
        ) : (
          <div className="flex flex-col gap-2">
            {itemDocuments.map((doc, i) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900">{doc.fileName}</span>
                    <Badge className="w-fit">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                  </div>
                </div>
                {documentUrls[i] && (
                  <a
                    href={documentUrls[i]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    פתיחה
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <Link
          href={`/homes/${homeId}/documents`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ניהול מסמכים →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">היסטוריית תחזוקה</h2>
        {itemMaintenance.length === 0 ? (
          <p className="text-sm text-neutral-500">אין רשומות תחזוקה לפריט זה</p>
        ) : (
          <div className="flex flex-col gap-2">
            {itemMaintenance.map((record) => (
              <div key={record.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <p className="text-sm text-neutral-900">{record.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{formatDate(record.performedAt)}</span>
                  {record.professionalName && (
                    <Badge variant="brand">{record.professionalName}</Badge>
                  )}
                  {formatPrice(record.cost) && (
                    <span className="font-medium text-neutral-700">{formatPrice(record.cost)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href={`/homes/${homeId}/maintenance`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ניהול תחזוקה →
        </Link>
      </div>
    </div>
  );
}
