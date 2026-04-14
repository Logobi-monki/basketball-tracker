import { Router } from "express";
import { db } from "@workspace/db";
import { statsTable, gamesTable, playersTable } from "@workspace/db";
import { eq, desc, avg, sum, count } from "drizzle-orm";
import { GetPlayerAnalyticsParams, GetPlayerTrendParams } from "@workspace/api-zod";

const router = Router();

function computeEfficiency(stat: {
  points: number; rebounds: number; assists: number; steals: number; blocks: number;
  turnovers: number; fieldGoalsMade: number; fieldGoalsAttempted: number;
  freeThrowsMade: number; freeThrowsAttempted: number;
}) {
  return (
    stat.points + stat.rebounds + stat.assists + stat.steals + stat.blocks
    - stat.turnovers
    - (stat.fieldGoalsAttempted - stat.fieldGoalsMade)
    - (stat.freeThrowsAttempted - stat.freeThrowsMade)
  );
}

function computeConsistency(values: number[]): number {
  if (values.length < 2) return 100;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
  return Math.max(0, Math.min(100, 100 - cv));
}

function computeFatigue(recentMins: number[], totalMins: number): number {
  if (recentMins.length === 0) return 0;
  const recentAvg = recentMins.reduce((a, b) => a + b, 0) / recentMins.length;
  const base = Math.min(100, (totalMins / (recentMins.length * 40)) * 50);
  const intensity = Math.min(50, (recentAvg / 40) * 50);
  return Math.round(base + intensity);
}

router.get("/players/:id/analytics", async (req, res) => {
  try {
    const { id } = GetPlayerAnalyticsParams.parse({ id: Number(req.params.id) });

    const stats = await db
      .select({ stat: statsTable, game: gamesTable })
      .from(statsTable)
      .leftJoin(gamesTable, eq(statsTable.gameId, gamesTable.id))
      .where(eq(statsTable.playerId, id))
      .orderBy(gamesTable.date);

    if (stats.length === 0) {
      return res.json({
        playerId: id,
        gamesPlayed: 0,
        ppg: 0, apg: 0, rpg: 0, spg: 0, bpg: 0, tpg: 0, mpg: 0,
        fieldGoalPct: 0, threePointPct: 0, freeThrowPct: 0,
        efficiencyRating: 0, plusMinusAvg: 0,
        consistencyScore: 0, fatigueIndex: 0,
        last5Ppg: 0, last5Apg: 0, last5Rpg: 0,
        seasonTotalPoints: 0, seasonTotalAssists: 0, seasonTotalRebounds: 0,
      });
    }

    const n = stats.length;
    const rows = stats.map(r => r.stat);
    const last5 = rows.slice(-5);

    const totalPoints = rows.reduce((a, s) => a + s.points, 0);
    const totalAssists = rows.reduce((a, s) => a + s.assists, 0);
    const totalRebounds = rows.reduce((a, s) => a + s.rebounds, 0);
    const totalSteals = rows.reduce((a, s) => a + s.steals, 0);
    const totalBlocks = rows.reduce((a, s) => a + s.blocks, 0);
    const totalTurnovers = rows.reduce((a, s) => a + s.turnovers, 0);
    const totalMinutes = rows.reduce((a, s) => a + s.minutesPlayed, 0);
    const totalFgm = rows.reduce((a, s) => a + s.fieldGoalsMade, 0);
    const totalFga = rows.reduce((a, s) => a + s.fieldGoalsAttempted, 0);
    const total3m = rows.reduce((a, s) => a + s.threesMade, 0);
    const total3a = rows.reduce((a, s) => a + s.threesAttempted, 0);
    const totalFtm = rows.reduce((a, s) => a + s.freeThrowsMade, 0);
    const totalFta = rows.reduce((a, s) => a + s.freeThrowsAttempted, 0);
    const totalPlusMinus = rows.reduce((a, s) => a + s.plusMinus, 0);
    const totalEfficiency = rows.reduce((a, s) => a + computeEfficiency(s), 0);

    const recentMinutes = last5.map(s => s.minutesPlayed);

    res.json({
      playerId: id,
      gamesPlayed: n,
      ppg: +(totalPoints / n).toFixed(1),
      apg: +(totalAssists / n).toFixed(1),
      rpg: +(totalRebounds / n).toFixed(1),
      spg: +(totalSteals / n).toFixed(1),
      bpg: +(totalBlocks / n).toFixed(1),
      tpg: +(totalTurnovers / n).toFixed(1),
      mpg: +(totalMinutes / n).toFixed(1),
      fieldGoalPct: totalFga > 0 ? +(totalFgm / totalFga * 100).toFixed(1) : 0,
      threePointPct: total3a > 0 ? +(total3m / total3a * 100).toFixed(1) : 0,
      freeThrowPct: totalFta > 0 ? +(totalFtm / totalFta * 100).toFixed(1) : 0,
      efficiencyRating: +(totalEfficiency / n).toFixed(1),
      plusMinusAvg: +(totalPlusMinus / n).toFixed(1),
      consistencyScore: +computeConsistency(rows.map(s => s.points)).toFixed(1),
      fatigueIndex: computeFatigue(recentMinutes, totalMinutes),
      last5Ppg: last5.length > 0 ? +(last5.reduce((a, s) => a + s.points, 0) / last5.length).toFixed(1) : 0,
      last5Apg: last5.length > 0 ? +(last5.reduce((a, s) => a + s.assists, 0) / last5.length).toFixed(1) : 0,
      last5Rpg: last5.length > 0 ? +(last5.reduce((a, s) => a + s.rebounds, 0) / last5.length).toFixed(1) : 0,
      seasonTotalPoints: totalPoints,
      seasonTotalAssists: totalAssists,
      seasonTotalRebounds: totalRebounds,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get player analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:id/trend", async (req, res) => {
  try {
    const { id } = GetPlayerTrendParams.parse({ id: Number(req.params.id) });

    const stats = await db
      .select({ stat: statsTable, game: gamesTable })
      .from(statsTable)
      .leftJoin(gamesTable, eq(statsTable.gameId, gamesTable.id))
      .where(eq(statsTable.playerId, id))
      .orderBy(gamesTable.date);

    res.json(stats.map(({ stat, game }) => ({
      gameId: stat.gameId,
      date: game?.date ?? "",
      opponent: game?.opponent ?? "",
      points: stat.points,
      assists: stat.assists,
      rebounds: stat.rebounds,
      efficiencyRating: +computeEfficiency(stat).toFixed(1),
      plusMinus: stat.plusMinus,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get player trend");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/leaderboard", async (req, res) => {
  try {
    const players = await db.select().from(playersTable);

    const leaderboard = await Promise.all(players.map(async (player) => {
      const stats = await db.select().from(statsTable).where(eq(statsTable.playerId, player.id));
      if (stats.length === 0) return null;

      const n = stats.length;
      const totalEfficiency = stats.reduce((a, s) => a + computeEfficiency(s), 0);

      return {
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        position: player.position,
        ppg: +(stats.reduce((a, s) => a + s.points, 0) / n).toFixed(1),
        apg: +(stats.reduce((a, s) => a + s.assists, 0) / n).toFixed(1),
        rpg: +(stats.reduce((a, s) => a + s.rebounds, 0) / n).toFixed(1),
        efficiencyRating: +(totalEfficiency / n).toFixed(1),
        gamesPlayed: n,
      };
    }));

    res.json(leaderboard.filter(Boolean).sort((a, b) => (b?.efficiencyRating ?? 0) - (a?.efficiencyRating ?? 0)));
  } catch (err) {
    req.log.error({ err }, "Failed to get leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/team-summary", async (req, res) => {
  try {
    const [playerCount] = await db.select({ count: count() }).from(playersTable);
    const [gameCount] = await db.select({ count: count() }).from(gamesTable);
    const players = await db.select().from(playersTable);

    if (players.length === 0) {
      return res.json({
        totalPlayers: 0, totalGames: 0,
        avgPpg: 0, avgApg: 0, avgRpg: 0,
        topScorer: "N/A", topAssister: "N/A", topRebounder: "N/A",
      });
    }

    const allAggregates = await Promise.all(players.map(async (player) => {
      const stats = await db.select().from(statsTable).where(eq(statsTable.playerId, player.id));
      if (stats.length === 0) return null;
      const n = stats.length;
      return {
        name: player.name,
        ppg: stats.reduce((a, s) => a + s.points, 0) / n,
        apg: stats.reduce((a, s) => a + s.assists, 0) / n,
        rpg: stats.reduce((a, s) => a + s.rebounds, 0) / n,
      };
    }));

    const valid = allAggregates.filter(Boolean) as { name: string; ppg: number; apg: number; rpg: number }[];
    const avgPpg = valid.length > 0 ? valid.reduce((a, p) => a + p.ppg, 0) / valid.length : 0;
    const avgApg = valid.length > 0 ? valid.reduce((a, p) => a + p.apg, 0) / valid.length : 0;
    const avgRpg = valid.length > 0 ? valid.reduce((a, p) => a + p.rpg, 0) / valid.length : 0;

    const topScorer = valid.sort((a, b) => b.ppg - a.ppg)[0]?.name ?? "N/A";
    const topAssister = [...valid].sort((a, b) => b.apg - a.apg)[0]?.name ?? "N/A";
    const topRebounder = [...valid].sort((a, b) => b.rpg - a.rpg)[0]?.name ?? "N/A";

    res.json({
      totalPlayers: playerCount.count,
      totalGames: gameCount.count,
      avgPpg: +avgPpg.toFixed(1),
      avgApg: +avgApg.toFixed(1),
      avgRpg: +avgRpg.toFixed(1),
      topScorer,
      topAssister,
      topRebounder,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
