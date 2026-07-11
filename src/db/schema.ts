import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const documentTypeEnum = pgEnum("document_type", [
  "receipt",
  "warranty",
  "manual",
  "other",
]);
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];

export const reminderStatusEnum = pgEnum("reminder_status", [
  "pending",
  "done",
  "dismissed",
]);
export type ReminderStatus = (typeof reminderStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

// Replaces Supabase's separate auth.users + profiles split: since Auth.js
// uses a Credentials provider with JWT sessions (no adapter), this single
// table holds both the login credential (passwordHash) and profile fields.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homes = pgTable("homes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  homeId: uuid("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// home_id is denormalized (kept in sync from rooms.home_id via a DB trigger,
// see drizzle/migrations) so ownership checks at the application layer don't
// need an extra join through rooms for every items query.
export const items = pgTable("items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  homeId: uuid("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  brand: text("brand"),
  model: text("model"),
  purchaseDate: date("purchase_date"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  warrantyExpiresAt: date("warranty_expires_at"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  homeId: uuid("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
  type: documentTypeEnum("type").notNull().default("other"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  extractedData: jsonb("extracted_data").$type<Record<string, unknown>>(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  profession: text("profession").notNull(),
  phone: text("phone"),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const maintenance = pgTable("maintenance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  homeId: uuid("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
  professionalId: uuid("professional_id").references(() => professionals.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  performedAt: date("performed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  homeId: uuid("home_id")
    .notNull()
    .references(() => homes.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueDate: date("due_date").notNull(),
  status: reminderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (enables Drizzle's relational query API: db.query.homes.findMany({ with: { rooms: true } }))
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  homes: many(homes),
  professionals: many(professionals),
}));

export const homesRelations = relations(homes, ({ one, many }) => ({
  owner: one(users, { fields: [homes.ownerId], references: [users.id] }),
  rooms: many(rooms),
  items: many(items),
  documents: many(documents),
  maintenance: many(maintenance),
  reminders: many(reminders),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  home: one(homes, { fields: [rooms.homeId], references: [homes.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  room: one(rooms, { fields: [items.roomId], references: [rooms.id] }),
  home: one(homes, { fields: [items.homeId], references: [homes.id] }),
  documents: many(documents),
  maintenance: many(maintenance),
  reminders: many(reminders),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  home: one(homes, { fields: [documents.homeId], references: [homes.id] }),
  item: one(items, { fields: [documents.itemId], references: [items.id] }),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  owner: one(users, { fields: [professionals.ownerId], references: [users.id] }),
  maintenance: many(maintenance),
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  home: one(homes, { fields: [maintenance.homeId], references: [homes.id] }),
  item: one(items, { fields: [maintenance.itemId], references: [items.id] }),
  professional: one(professionals, {
    fields: [maintenance.professionalId],
    references: [professionals.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  home: one(homes, { fields: [reminders.homeId], references: [homes.id] }),
  item: one(items, { fields: [reminders.itemId], references: [items.id] }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Home = typeof homes.$inferSelect;
export type NewHome = typeof homes.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;
export type Maintenance = typeof maintenance.$inferSelect;
export type NewMaintenance = typeof maintenance.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
