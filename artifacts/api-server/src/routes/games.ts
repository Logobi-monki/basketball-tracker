import { Router } from "express";
import { db } from "@workspace/db";
import { gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateGameBody, GetGameParams, DeleteGameParams } from "@workspace/api-zod";

const router = Router();

router.get("/games", async (req, res) => {
  try {
    const games = await db.select().from(gamesTable).orderBy(gamesTable.date);
    res.json(games.map(formatGame));
  } catch (err) {
    req.log.error({ err }, "Failed to list games");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/games", async (req, res) => {
  try {
    const body = CreateGameBody.parse(req.body);
    const [game] = await db.insert(gamesTable).values(body).returning();
    res.status(201).json(formatGame(game));
  } catch (err) {
    req.log.error({ err }, "Failed to create game");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/games/:id", async (req, res) => {
  try {
    const { id } = GetGameParams.parse({ id: Number(req.params.id) });
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id));
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json(formatGame(game));
  } catch (err) {
    req.log.error({ err }, "Failed to get game");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/games/:id", async (req, res) => {
  try {
    const { id } = DeleteGameParams.parse({ id: Number(req.params.id) });
    await db.delete(gamesTable).where(eq(gamesTable.id, id));
    res.json({ message: "Game deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete game");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatGame(g: typeof gamesTable.$inferSelect) {
  return {
    id: g.id,
    date: g.date,
    opponent: g.opponent,
    homeAway: g.homeAway,
    result: g.result,
    teamScore: g.teamScore,
    opponentScore: g.opponentScore,
    createdAt: g.createdAt.toISOString(),
  };
}

export default router;
