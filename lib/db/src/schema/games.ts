import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  opponent: text("opponent").notNull(),
  homeAway: text("home_away").notNull().default("home"),
  result: text("result").notNull().default("W"),
  teamScore: integer("team_score").notNull(),
  opponentScore: integer("opponent_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
