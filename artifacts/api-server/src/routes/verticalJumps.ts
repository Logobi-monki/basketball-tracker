import { Router } from "express";
import { db } from "@workspace/db";
import { verticalJumpsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetVerticalJumpHistoryParams, AddVerticalJumpParams, AddVerticalJumpBody } from "@workspace/api-zod";

const router = Router();

router.get("/players/:id/vertical-jump", async (req, res) => {
  try {
    const { id } = GetVerticalJumpHistoryParams.parse({ id: Number(req.params.id) });
    const entries = await db
      .select()
      .from(verticalJumpsTable)
      .where(eq(verticalJumpsTable.playerId, id))
      .orderBy(verticalJumpsTable.date);

    res.json(entries.map(formatEntry));
  } catch (err) {
    req.log.error({ err }, "Failed to get vertical jump history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/players/:id/vertical-jump", async (req, res) => {
  try {
    const { id } = AddVerticalJumpParams.parse({ id: Number(req.params.id) });
    const body = AddVerticalJumpBody.parse(req.body);

    // Accept either inches or cm — compute the missing one
    let valueInches: number;
    let valueCm: number;

    if (body.valueInches != null && body.valueCm == null) {
      valueInches = body.valueInches;
      valueCm = +(body.valueInches * 2.54).toFixed(1);
    } else if (body.valueCm != null && body.valueInches == null) {
      valueCm = body.valueCm;
      valueInches = +(body.valueCm / 2.54).toFixed(2);
    } else if (body.valueInches != null && body.valueCm != null) {
      valueInches = body.valueInches;
      valueCm = body.valueCm;
    } else {
      return res.status(400).json({ error: "Provide valueInches or valueCm (or both)" });
    }

    const [entry] = await db
      .insert(verticalJumpsTable)
      .values({
        playerId: id,
        valueInches,
        valueCm,
        date: body.date,
        notes: body.notes ?? null,
      })
      .returning();

    res.status(201).json(formatEntry(entry));
  } catch (err) {
    req.log.error({ err }, "Failed to add vertical jump entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

function formatEntry(e: typeof verticalJumpsTable.$inferSelect) {
  return {
    id: e.id,
    playerId: e.playerId,
    valueInches: e.valueInches,
    valueCm: e.valueCm,
    date: e.date,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
  };
}

export default router;
