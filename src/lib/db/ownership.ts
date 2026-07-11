import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { homes, rooms, items, documents, professionals, maintenance } from "@/db/schema";

/**
 * Ownership-scoped lookups. Since Neon has no Row Level Security, these are
 * the single source of truth for "does this user actually own this row" —
 * every Server Action and page that touches homes/rooms/items should go
 * through one of these instead of querying the tables directly by id, so
 * the authorization check can never accidentally be skipped.
 */

export async function getOwnedHome(homeId: string, userId: string) {
  const [home] = await db
    .select()
    .from(homes)
    .where(and(eq(homes.id, homeId), eq(homes.ownerId, userId)))
    .limit(1);
  return home ?? null;
}

export async function getOwnedRoom(roomId: string, userId: string) {
  const [row] = await db
    .select({ room: rooms })
    .from(rooms)
    .innerJoin(homes, eq(homes.id, rooms.homeId))
    .where(and(eq(rooms.id, roomId), eq(homes.ownerId, userId)))
    .limit(1);
  return row?.room ?? null;
}

export async function getOwnedItem(itemId: string, userId: string) {
  const [row] = await db
    .select({ item: items })
    .from(items)
    .innerJoin(homes, eq(homes.id, items.homeId))
    .where(and(eq(items.id, itemId), eq(homes.ownerId, userId)))
    .limit(1);
  return row?.item ?? null;
}

/**
 * Verifies a room belongs (transitively) to a specific home owned by the
 * user — used when creating an item, to make sure the room the client
 * claims to be inserting into is actually the user's own room under the
 * home they claim.
 */
export async function getOwnedRoomInHome(roomId: string, homeId: string, userId: string) {
  const [row] = await db
    .select({ room: rooms })
    .from(rooms)
    .innerJoin(homes, eq(homes.id, rooms.homeId))
    .where(
      and(eq(rooms.id, roomId), eq(rooms.homeId, homeId), eq(homes.ownerId, userId))
    )
    .limit(1);
  return row?.room ?? null;
}

export async function getOwnedDocument(documentId: string, userId: string) {
  const [row] = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(homes, eq(homes.id, documents.homeId))
    .where(and(eq(documents.id, documentId), eq(homes.ownerId, userId)))
    .limit(1);
  return row?.document ?? null;
}

export async function getOwnedProfessional(professionalId: string, userId: string) {
  const [professional] = await db
    .select()
    .from(professionals)
    .where(and(eq(professionals.id, professionalId), eq(professionals.ownerId, userId)))
    .limit(1);
  return professional ?? null;
}

export async function getOwnedMaintenanceRecord(maintenanceId: string, userId: string) {
  const [row] = await db
    .select({ maintenance })
    .from(maintenance)
    .innerJoin(homes, eq(homes.id, maintenance.homeId))
    .where(and(eq(maintenance.id, maintenanceId), eq(homes.ownerId, userId)))
    .limit(1);
  return row?.maintenance ?? null;
}
