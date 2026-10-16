import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const productionBoard = sqliteTable("production_board", {
 id:text("id").primaryKey(),
 payload:text("payload").notNull(),
 revision:integer("revision").notNull().default(0),
 updatedAt:text("updated_at").notNull(),
 updatedBy:text("updated_by").notNull()
});

export const chatEmployees=sqliteTable("chat_employees",{name:text("name").primaryKey(),pinHash:text("pin_hash").notNull(),salt:text("salt").notNull(),failures:integer("failures").notNull().default(0),lockedUntil:integer("locked_until").notNull().default(0)});
export const chatSessions=sqliteTable("chat_sessions",{tokenHash:text("token_hash").primaryKey(),employee:text("employee").notNull(),expiresAt:integer("expires_at").notNull()},table=>[index("chat_session_expiry").on(table.expiresAt)]);
export const chatMessages=sqliteTable("chat_messages",{id:integer("id").primaryKey({autoIncrement:true}),clientId:text("client_id").notNull(),channel:text("channel").notNull(),author:text("author").notNull(),body:text("body").notNull(),mentions:text("mentions").notNull(),referenceOrder:text("reference_order").notNull().default(""),createdAt:text("created_at").notNull()},table=>[uniqueIndex("chat_message_retry").on(table.author,table.clientId),index("chat_message_channel").on(table.channel,table.id)]);
export const chatReads=sqliteTable("chat_reads",{employee:text("employee").notNull(),channel:text("channel").notNull(),lastId:integer("last_id").notNull().default(0)},table=>[primaryKey({columns:[table.employee,table.channel]})]);
