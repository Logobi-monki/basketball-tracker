import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

export const verticalJumpsTable = pgTable("vertical_jumps", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  valueInches: real("value_inches").notNull(),
  valueCm: real("value_cm").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVerticalJumpSchema = createInsertSchema(verticalJumpsTable).omit({ id: true, createdAt: true });
export type InsertVerticalJump = z.infer<typeof insertVerticalJumpSchema>;
export type VerticalJump = typeof verticalJumpsTable.$inferSelect;
