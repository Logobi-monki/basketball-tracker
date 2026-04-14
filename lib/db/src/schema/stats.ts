import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";
import { gamesTable } from "./games";

export const statsTable = pgTable("stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => gamesTable.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  rebounds: integer("rebounds").notNull().default(0),
  steals: integer("steals").notNull().default(0),
  blocks: integer("blocks").notNull().default(0),
  turnovers: integer("turnovers").notNull().default(0),
  minutesPlayed: real("minutes_played").notNull().default(0),
  fieldGoalsMade: integer("field_goals_made").notNull().default(0),
  fieldGoalsAttempted: integer("field_goals_attempted").notNull().default(0),
  threesMade: integer("threes_made").notNull().default(0),
  threesAttempted: integer("threes_attempted").notNull().default(0),
  freeThrowsMade: integer("free_throws_made").notNull().default(0),
  freeThrowsAttempted: integer("free_throws_attempted").notNull().default(0),
  plusMinus: integer("plus_minus").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStatSchema = createInsertSchema(statsTable).omit({ id: true, createdAt: true });
export type InsertStat = z.infer<typeof insertStatSchema>;
export type Stat = typeof statsTable.$inferSelect;
