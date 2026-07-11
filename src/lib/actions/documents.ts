"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents, type DocumentType } from "@/db/schema";
import { getOwnedHome, getOwnedDocument, getOwnedItem } from "@/lib/db/ownership";
import {
  buildDocumentKey,
  createUploadUrl,
  deleteObject,
  isAllowedDocumentType,
  isStorageConfigured,
} from "@/lib/storage/r2";

export interface RequestUploadResult {
  error: string | null;
  uploadUrl?: string;
  objectKey?: string;
}

const NOT_CONFIGURED_MESSAGE =
  "אחסון הקבצים עדיין לא מוגדר. יש להזין את פרטי Cloudflare R2 בקובץ .env.local (ראו README).";

/**
 * Step 1 of the upload flow: verify the person owns the target home (and
 * item, if attaching to one), then hand back a short-lived presigned PUT
 * URL. The browser uploads the file bytes directly to R2 from here — they
 * never pass through the Next.js server.
 */
export async function requestDocumentUpload(
  homeId: string,
  fileName: string,
  contentType: string,
  itemId?: string
): Promise<RequestUploadResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }
  if (!isStorageConfigured()) {
    return { error: NOT_CONFIGURED_MESSAGE };
  }
  if (!isAllowedDocumentType(contentType)) {
    return { error: "סוג קובץ לא נתמך. ניתן להעלות תמונות (JPG/PNG/WebP/HEIC) או PDF." };
  }

  const home = await getOwnedHome(homeId, session.user.id);
  if (!home) {
    return { error: "הבית לא נמצא." };
  }

  if (itemId) {
    const item = await getOwnedItem(itemId, session.user.id);
    if (!item || item.homeId !== homeId) {
      return { error: "הפריט לא נמצא." };
    }
  }

  const objectKey = buildDocumentKey(session.user.id, homeId, fileName);
  const uploadUrl = await createUploadUrl(objectKey, contentType);

  return { error: null, uploadUrl, objectKey };
}

export interface ConfirmUploadState {
  error: string | null;
}

/**
 * Step 2: after the browser successfully PUTs the file to the presigned
 * URL, this persists the document row. Re-verifies ownership independently
 * — never trusts that the client only called this after a real upload.
 */
export async function confirmDocumentUpload(
  homeId: string,
  objectKey: string,
  fileName: string,
  type: DocumentType,
  itemId: string | null
): Promise<ConfirmUploadState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "יש להתחבר מחדש." };
  }

  const home = await getOwnedHome(homeId, session.user.id);
  if (!home) {
    return { error: "הבית לא נמצא." };
  }

  // The key format itself encodes the owning user + home
  // (documents/{userId}/{homeId}/...) — refuse to persist a row pointing
  // at an object key that wasn't actually issued for this user and home.
  const expectedPrefix = `documents/${session.user.id}/${homeId}/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    return { error: "שגיאה באימות הקובץ שהועלה." };
  }

  if (itemId) {
    const item = await getOwnedItem(itemId, session.user.id);
    if (!item || item.homeId !== homeId) {
      return { error: "הפריט לא נמצא." };
    }
  }

  await db.insert(documents).values({
    homeId,
    itemId: itemId || null,
    type,
    fileUrl: objectKey,
    fileName,
  });

  revalidatePath(`/homes/${homeId}/documents`);
  return { error: null };
}

export async function deleteDocument(documentId: string, homeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const document = await getOwnedDocument(documentId, session.user.id);
  if (!document) {
    redirect(`/homes/${homeId}/documents`);
  }

  await db.delete(documents).where(eq(documents.id, documentId));

  if (isStorageConfigured()) {
    // Best-effort: the DB row is the source of truth for what the user
    // sees, so we don't want a storage hiccup to block the delete they
    // asked for. Orphaned objects can be swept later.
    try {
      await deleteObject(document.fileUrl);
    } catch (error) {
      console.error("Failed to delete R2 object", document.fileUrl, error);
    }
  }

  revalidatePath(`/homes/${homeId}/documents`);
  redirect(`/homes/${homeId}/documents`);
}
