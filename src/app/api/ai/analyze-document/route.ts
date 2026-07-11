import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getOwnedDocument } from "@/lib/db/ownership";
import { getObjectBytes, inferMimeTypeFromFileName, isStorageConfigured } from "@/lib/storage/r2";
import { analyzeDocumentImage, isGeminiConfigured } from "@/services/gemini";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "יש להתחבר מחדש." }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "ניתוח AI עדיין לא מוגדר. יש להזין GEMINI_API_KEY בקובץ .env.local (ראו README)." },
      { status: 503 }
    );
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "אחסון הקבצים עדיין לא מוגדר, לכן לא ניתן לנתח מסמכים." },
      { status: 503 }
    );
  }

  let documentId: string;
  try {
    const body = await request.json();
    documentId = String(body.documentId ?? "");
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  if (!documentId) {
    return NextResponse.json({ error: "חסר מזהה מסמך." }, { status: 400 });
  }

  // Ownership check — this is what stands in for RLS here. Without it, any
  // authenticated user could pass an arbitrary documentId and have the
  // server fetch and analyze someone else's private file.
  const document = await getOwnedDocument(documentId, session.user.id);
  if (!document) {
    return NextResponse.json({ error: "המסמך לא נמצא." }, { status: 404 });
  }

  const mimeType = inferMimeTypeFromFileName(document.fileName);
  if (!mimeType) {
    return NextResponse.json({ error: "סוג הקובץ אינו נתמך לניתוח." }, { status: 400 });
  }

  try {
    const fileBytes = await getObjectBytes(document.fileUrl);
    const extracted = await analyzeDocumentImage(fileBytes, mimeType);

    await db
      .update(documents)
      .set({ extractedData: extracted })
      .where(eq(documents.id, documentId));

    return NextResponse.json({ data: extracted });
  } catch (error) {
    console.error("Document analysis failed", documentId, error);
    return NextResponse.json(
      { error: "ניתוח המסמך נכשל. נסו שוב מאוחר יותר." },
      { status: 502 }
    );
  }
}
