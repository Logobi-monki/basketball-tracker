import { Router } from "express";
import { db } from "@workspace/db";
import { statsTable, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateStatBody, GetPlayerStatsParams } from "@workspace/api-zod";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const stats = await db.select().from(statsTable).orderBy(statsTable.gameId);
    res.json(stats.map(formatStat));
  } catch (err) {
    req.log.error({ err }, "Failed to list stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/stats", async (req, res) => {
  try {
    const body = CreateStatBody.parse(req.body);
    const [stat] = await db.insert(statsTable).values(body).returning();
    res.status(201).json(formatStat(stat));
  } catch (err) {
    req.log.error({ err }, "Failed to create stat");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/players/:id/stats", async (req, res) => {
  try {
    const { id } = GetPlayerStatsParams.parse({ id: Number(req.params.id) });
    const rows = await db
      .select({ stat: statsTable, game: gamesTable })
      .from(statsTable)
      .leftJoin(gamesTable, eq(statsTable.gameId, gamesTable.id))
      .where(eq(statsTable.playerId, id))
      .orderBy(gamesTable.date);

    res.json(rows.map(({ stat, game }) => ({
      ...formatStat(stat),
      game: game ? {
        id: game.id,
        date: game.date,
        opponent: game.opponent,
        homeAway: game.homeAway,
        result: game.result,
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        createdAt: game.createdAt.toISOString(),
      } : undefined,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get player stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatStat(s: typeof statsTable.$inferSelect) {
  return {
    id: s.id,
    playerId: s.playerId,
    gameId: s.gameId,
    points: s.points,
    assists: s.assists,
    rebounds: s.rebounds,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
    minutesPlayed: s.minutesPlayed,
    fieldGoalsMade: s.fieldGoalsMade,
    fieldGoalsAttempted: s.fieldGoalsAttempted,
    threesMade: s.threesMade,
    threesAttempted: s.threesAttempted,
    freeThrowsMade: s.freeThrowsMade,
    freeThrowsAttempted: s.freeThrowsAttempted,
    plusMinus: s.plusMinus,
  };
}

export default router;
