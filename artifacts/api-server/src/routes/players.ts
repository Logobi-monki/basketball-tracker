import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, insertPlayerSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePlayerBody,
  GetPlayerParams,
  UpdatePlayerBody,
  UpdatePlayerParams,
  DeletePlayerParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/players", async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(playersTable.name);
    res.json(players.map(formatPlayer));
  } catch (err) {
    req.log.error({ err }, "Failed to list players");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/players", async (req, res) => {
  try {
    const body = CreatePlayerBody.parse(req.body);
    const [player] = await db.insert(playersTable).values(body).returning();
    res.status(201).json(formatPlayer(player));
  } catch (err) {
    req.log.error({ err }, "Failed to create player");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/players/:id", async (req, res) => {
  try {
    const { id } = GetPlayerParams.parse({ id: Number(req.params.id) });
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json(formatPlayer(player));
  } catch (err) {
    req.log.error({ err }, "Failed to get player");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/players/:id", async (req, res) => {
  try {
    const { id } = UpdatePlayerParams.parse({ id: Number(req.params.id) });
    const body = UpdatePlayerBody.parse(req.body);
    const [player] = await db.update(playersTable).set(body).where(eq(playersTable.id, id)).returning();
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json(formatPlayer(player));
  } catch (err) {
    req.log.error({ err }, "Failed to update player");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.delete("/players/:id", async (req, res) => {
  try {
    const { id } = DeletePlayerParams.parse({ id: Number(req.params.id) });
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.json({ message: "Player deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete player");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatPlayer(p: typeof playersTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    team: p.team,
    position: p.position,
    number: p.number,
    season: p.season,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
