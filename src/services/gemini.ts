import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL = "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY env var.");
    }
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Extraction schema — the single source of truth for both the JSON schema
// handed to Gemini (responseSchema, forces well-formed JSON) and the zod
// schema used to independently re-validate the model's output before it's
// ever trusted (stored in the DB, shown in the UI, or used to prefill a
// form). Never trust the model's JSON just because responseSchema was set.
// ---------------------------------------------------------------------------

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    documentType: {
      type: "STRING",
      enum: ["receipt", "warranty", "manual", "other"],
      description: "The kind of document this is.",
    },
    vendorName: {
      type: "STRING",
      nullable: true,
      description: "Store or manufacturer name, if visible.",
    },
    purchaseDate: {
      type: "STRING",
      nullable: true,
      description: "Purchase or issue date in YYYY-MM-DD format, if visible.",
    },
    totalAmount: {
      type: "NUMBER",
      nullable: true,
      description: "Total amount charged, as a plain number without currency symbol.",
    },
    currency: {
      type: "STRING",
      nullable: true,
      description: "Currency code, e.g. ILS, USD. Assume ILS if a ₪ symbol is shown.",
    },
    brand: {
      type: "STRING",
      nullable: true,
      description: "Product brand, if this is a warranty card, manual, or product receipt.",
    },
    model: {
      type: "STRING",
      nullable: true,
      description: "Product model number/name, if visible.",
    },
    warrantyExpiresAt: {
      type: "STRING",
      nullable: true,
      description:
        "Warranty expiration date in YYYY-MM-DD format, if stated or computable from a stated warranty period plus purchase date.",
    },
    summary: {
      type: "STRING",
      nullable: true,
      description: "One short sentence in Hebrew summarizing what this document is.",
    },
  },
  required: ["documentType"],
};

const ExtractedDocumentSchema = z.object({
  documentType: z.enum(["receipt", "warranty", "manual", "other"]),
  vendorName: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  warrantyExpiresAt: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export type ExtractedDocumentData = z.infer<typeof ExtractedDocumentSchema>;

const PROMPT = `You are analyzing a document image or PDF for a home-inventory app used by Israeli families (documents are usually in Hebrew or English).

Identify what kind of document this is (receipt, warranty card, product manual, or other), then extract whatever of the following fields are actually visible or clearly inferable. Never guess or fabricate a value — leave a field null if it is not present in the document. Dates must be YYYY-MM-DD. If a warranty period is stated (e.g. "12 months from purchase") and a purchase date is visible, compute warrantyExpiresAt from those two facts; otherwise leave it null.`;

/**
 * Analyzes a document image or PDF and returns structured, validated data.
 * Throws on any failure — callers should catch and translate to a
 * user-facing error rather than silently persisting unvalidated data.
 */
export async function analyzeDocumentImage(
  fileBytes: Buffer,
  mimeType: string
): Promise<ExtractedDocumentData> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: fileBytes.toString("base64") } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }

  const result = ExtractedDocumentSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Gemini response failed validation: ${result.error.message}`);
  }

  return result.data;
}
