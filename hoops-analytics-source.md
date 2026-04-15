# Hoops Analytics — Full Source Code

A full-stack basketball performance tracking dashboard built with:
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Wouter, TanStack Query
- **Backend:** Node.js, Express, Drizzle ORM, PostgreSQL, Pino logger
- **Code-gen:** OpenAPI → TypeScript hooks via Orval

---

## Repository / Folder Structure

```
hoops-analytics/
│
├── pnpm-workspace.yaml              # Monorepo workspace config
├── package.json                     # Root package.json
│
├── artifacts/
│   │
│   ├── api-server/                  # Express REST API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── build.mjs                # ESBuild script
│   │   └── src/
│   │       ├── index.ts             # Entry — reads PORT, starts server
│   │       ├── app.ts               # Express app, middleware, routes
│   │       └── routes/
│   │           ├── index.ts         # Registers all routers
│   │           ├── health.ts        # GET /api/healthz
│   │           ├── players.ts       # CRUD /api/players
│   │           ├── games.ts         # CRUD /api/games
│   │           ├── stats.ts         # GET/POST /api/stats, /api/players/:id/stats
│   │           ├── analytics.ts     # Analytics & leaderboard endpoints
│   │           └── verticalJumps.ts # GET/POST /api/players/:id/vertical-jump
│   │
│   └── hoops-dashboard/             # React frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── components.json          # shadcn/ui config
│       └── src/
│           ├── main.tsx             # React DOM root
│           ├── App.tsx              # Router — wouter routes
│           ├── index.css            # Global styles / CSS variables
│           ├── components/
│           │   ├── layout.tsx       # Sidebar + nav shell
│           │   ├── stat-card.tsx    # Reusable KPI card
│           │   └── ui/              # shadcn/ui components (button, input, …)
│           ├── pages/
│           │   ├── dashboard.tsx    # Team overview & leaderboard
│           │   ├── players-list.tsx # Roster grid with search & delete
│           │   ├── player-profile.tsx  # Per-player stats, charts, vert jump
│           │   ├── new-player.tsx   # Add player form
│           │   ├── games-list.tsx   # Games table with delete
│           │   ├── game-mode.tsx    # Live coaching tool (full-screen)
│           │   └── not-found.tsx    # 404 page
│           ├── hooks/
│           │   ├── use-toast.ts
│           │   └── use-mobile.tsx
│           └── lib/
│               ├── utils.ts
│               └── theme.ts
│
└── lib/
    ├── db/                          # Database layer (Drizzle ORM)
    │   ├── package.json
    │   ├── drizzle.config.ts
    │   └── src/
    │       ├── index.ts             # Exports db client
    │       └── schema/
    │           ├── index.ts         # Re-exports all tables
    │           ├── players.ts
    │           ├── games.ts
    │           ├── stats.ts
    │           └── verticalJumps.ts
    │
    ├── api-spec/                    # OpenAPI spec + Orval codegen
    │   ├── package.json
    │   ├── orval.config.ts
    │   └── openapi.yaml             # Single source of truth for all endpoints
    │
    ├── api-client-react/            # Generated TanStack Query hooks
    │   └── src/generated/api.ts
    │
    └── api-zod/                     # Generated Zod validators
        └── src/generated/api.ts
```

---

## Database Schema

### `lib/db/src/schema/players.ts`

```typescript
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  position: text("position").notNull(),
  number: integer("number").notNull(),
  season: text("season").notNull().default("2024-25"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
```

### `lib/db/src/schema/games.ts`

```typescript
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
```

### `lib/db/src/schema/stats.ts`

```typescript
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
```

### `lib/db/src/schema/verticalJumps.ts`

```typescript
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
```

### `lib/db/src/schema/index.ts`

```typescript
export * from "./players";
export * from "./games";
export * from "./stats";
export * from "./verticalJumps";
```

---

## API Server

### `artifacts/api-server/src/index.ts`

```typescript
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
```

### `artifacts/api-server/src/app.ts`

```typescript
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

export default app;
```

### `artifacts/api-server/src/lib/logger.ts`

```typescript
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction ? {} : {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
```

### `artifacts/api-server/src/routes/index.ts`

```typescript
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import gamesRouter from "./games";
import statsRouter from "./stats";
import analyticsRouter from "./analytics";
import verticalJumpsRouter from "./verticalJumps";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(gamesRouter);
router.use(statsRouter);
router.use(analyticsRouter);
router.use(verticalJumpsRouter);

export default router;
```

### `artifacts/api-server/src/routes/health.ts`

```typescript
import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
```

### `artifacts/api-server/src/routes/players.ts`

```typescript
import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, insertPlayerSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePlayerBody, GetPlayerParams, UpdatePlayerBody,
  UpdatePlayerParams, DeletePlayerParams,
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
    id: p.id, name: p.name, team: p.team,
    position: p.position, number: p.number,
    season: p.season, createdAt: p.createdAt.toISOString(),
  };
}

export default router;
```

### `artifacts/api-server/src/routes/games.ts`

```typescript
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
    id: g.id, date: g.date, opponent: g.opponent,
    homeAway: g.homeAway, result: g.result,
    teamScore: g.teamScore, opponentScore: g.opponentScore,
    createdAt: g.createdAt.toISOString(),
  };
}

export default router;
```

### `artifacts/api-server/src/routes/stats.ts`

```typescript
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
        id: game.id, date: game.date, opponent: game.opponent,
        homeAway: game.homeAway, result: game.result,
        teamScore: game.teamScore, opponentScore: game.opponentScore,
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
    id: s.id, playerId: s.playerId, gameId: s.gameId,
    points: s.points, assists: s.assists, rebounds: s.rebounds,
    steals: s.steals, blocks: s.blocks, turnovers: s.turnovers,
    minutesPlayed: s.minutesPlayed,
    fieldGoalsMade: s.fieldGoalsMade, fieldGoalsAttempted: s.fieldGoalsAttempted,
    threesMade: s.threesMade, threesAttempted: s.threesAttempted,
    freeThrowsMade: s.freeThrowsMade, freeThrowsAttempted: s.freeThrowsAttempted,
    plusMinus: s.plusMinus,
  };
}

export default router;
```

### `artifacts/api-server/src/routes/analytics.ts`

```typescript
import { Router } from "express";
import { db } from "@workspace/db";
import { statsTable, gamesTable, playersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
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

// GET /players/:id/analytics
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
        playerId: id, gamesPlayed: 0,
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

    const totalPoints    = rows.reduce((a, s) => a + s.points, 0);
    const totalAssists   = rows.reduce((a, s) => a + s.assists, 0);
    const totalRebounds  = rows.reduce((a, s) => a + s.rebounds, 0);
    const totalSteals    = rows.reduce((a, s) => a + s.steals, 0);
    const totalBlocks    = rows.reduce((a, s) => a + s.blocks, 0);
    const totalTurnovers = rows.reduce((a, s) => a + s.turnovers, 0);
    const totalMinutes   = rows.reduce((a, s) => a + s.minutesPlayed, 0);
    const totalFgm  = rows.reduce((a, s) => a + s.fieldGoalsMade, 0);
    const totalFga  = rows.reduce((a, s) => a + s.fieldGoalsAttempted, 0);
    const total3m   = rows.reduce((a, s) => a + s.threesMade, 0);
    const total3a   = rows.reduce((a, s) => a + s.threesAttempted, 0);
    const totalFtm  = rows.reduce((a, s) => a + s.freeThrowsMade, 0);
    const totalFta  = rows.reduce((a, s) => a + s.freeThrowsAttempted, 0);
    const totalPlusMinus = rows.reduce((a, s) => a + s.plusMinus, 0);
    const totalEfficiency = rows.reduce((a, s) => a + computeEfficiency(s), 0);

    res.json({
      playerId: id, gamesPlayed: n,
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
      fatigueIndex: computeFatigue(rows.slice(-5).map(s => s.minutesPlayed), totalMinutes),
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

// GET /players/:id/trend
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

// GET /analytics/leaderboard
router.get("/analytics/leaderboard", async (req, res) => {
  try {
    const players = await db.select().from(playersTable);
    const leaderboard = await Promise.all(players.map(async (player) => {
      const stats = await db.select().from(statsTable).where(eq(statsTable.playerId, player.id));
      if (stats.length === 0) return null;
      const n = stats.length;
      const totalEfficiency = stats.reduce((a, s) => a + computeEfficiency(s), 0);
      return {
        playerId: player.id, playerName: player.name,
        team: player.team, position: player.position,
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

// GET /analytics/team-summary
router.get("/analytics/team-summary", async (req, res) => {
  try {
    const [playerCount] = await db.select({ count: count() }).from(playersTable);
    const [gameCount]   = await db.select({ count: count() }).from(gamesTable);
    const players = await db.select().from(playersTable);

    if (players.length === 0) {
      return res.json({
        totalPlayers: 0, totalGames: 0,
        avgPpg: 0, avgApg: 0, avgRpg: 0,
        topScorer: "N/A", topAssister: "N/A", topRebounder: "N/A",
      });
    }

    const allAgg = await Promise.all(players.map(async (player) => {
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

    const valid = allAgg.filter(Boolean) as { name: string; ppg: number; apg: number; rpg: number }[];
    const avgPpg = valid.length > 0 ? valid.reduce((a, p) => a + p.ppg, 0) / valid.length : 0;
    const avgApg = valid.length > 0 ? valid.reduce((a, p) => a + p.apg, 0) / valid.length : 0;
    const avgRpg = valid.length > 0 ? valid.reduce((a, p) => a + p.rpg, 0) / valid.length : 0;

    res.json({
      totalPlayers: playerCount.count, totalGames: gameCount.count,
      avgPpg: +avgPpg.toFixed(1), avgApg: +avgApg.toFixed(1), avgRpg: +avgRpg.toFixed(1),
      topScorer:    valid.sort((a, b) => b.ppg - a.ppg)[0]?.name ?? "N/A",
      topAssister:  [...valid].sort((a, b) => b.apg - a.apg)[0]?.name ?? "N/A",
      topRebounder: [...valid].sort((a, b) => b.rpg - a.rpg)[0]?.name ?? "N/A",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### `artifacts/api-server/src/routes/verticalJumps.ts`

```typescript
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
      .values({ playerId: id, valueInches, valueCm, date: body.date, notes: body.notes ?? null })
      .returning();

    res.status(201).json(formatEntry(entry));
  } catch (err) {
    req.log.error({ err }, "Failed to add vertical jump entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

function formatEntry(e: typeof verticalJumpsTable.$inferSelect) {
  return {
    id: e.id, playerId: e.playerId,
    valueInches: e.valueInches, valueCm: e.valueCm,
    date: e.date, notes: e.notes,
    createdAt: e.createdAt.toISOString(),
  };
}

export default router;
```

---

## Frontend

### `artifacts/hoops-dashboard/src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### `artifacts/hoops-dashboard/src/App.tsx`

```tsx
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import PlayersList from "@/pages/players-list";
import PlayerProfile from "@/pages/player-profile";
import GamesList from "@/pages/games-list";
import NewPlayer from "@/pages/new-player";
import GameMode from "@/pages/game-mode";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Router() {
  return (
    <Switch>
      <Route path="/game-mode" component={GameMode} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/players" component={PlayersList} />
            <Route path="/players/new" component={NewPlayer} />
            <Route path="/players/:id" component={PlayerProfile} />
            <Route path="/games" component={GamesList} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### `artifacts/hoops-dashboard/src/components/layout.tsx`

```tsx
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Users, LayoutDashboard, CalendarDays, Radio } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/players", label: "Roster", icon: Users },
    { href: "/games", label: "Games", icon: CalendarDays },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
        <div className="h-14 flex items-center px-6 border-b border-sidebar-border gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-bold text-sidebar-foreground tracking-tight">HOOPS ANALYTICS</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-4">
          <Link href="/game-mode"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <Radio className="w-4 h-4" />
            Game Mode
          </Link>
        </div>
        <div className="px-4 pb-4 border-t border-sidebar-border pt-4 text-xs text-muted-foreground font-mono">
          SYSTEM_STATUS: ONLINE<br />VERSION: 1.0.0
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
```

### `artifacts/hoops-dashboard/src/components/stat-card.tsx`

```tsx
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-5 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {subtitle && <span className="text-sm font-mono text-muted-foreground">{subtitle}</span>}
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-xs font-medium ${trend.value >= 0 ? "text-green-500" : "text-destructive"}`}>
          <span>{trend.value >= 0 ? "+" : ""}{trend.value}</span>
          <span className="ml-1 text-muted-foreground font-mono">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
```

---

## API Endpoints Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/players` | List all players |
| POST | `/api/players` | Create player |
| GET | `/api/players/:id` | Get player |
| PUT | `/api/players/:id` | Update player |
| DELETE | `/api/players/:id` | Delete player (cascades stats + vert jumps) |
| GET | `/api/games` | List all games |
| POST | `/api/games` | Create game |
| GET | `/api/games/:id` | Get game |
| DELETE | `/api/games/:id` | Delete game (cascades stats) |
| GET | `/api/stats` | List all stats |
| POST | `/api/stats` | Record game stats for a player |
| GET | `/api/players/:id/stats` | Get all stats for a player |
| GET | `/api/players/:id/analytics` | Computed analytics (PPG, EFF, consistency, fatigue…) |
| GET | `/api/players/:id/trend` | Per-game trend data for charts |
| GET | `/api/players/:id/vertical-jump` | Vertical jump history |
| POST | `/api/players/:id/vertical-jump` | Log a jump measurement |
| GET | `/api/analytics/leaderboard` | Team leaderboard sorted by efficiency |
| GET | `/api/analytics/team-summary` | Team-level aggregate stats |

---

## Key Libraries

| Package | Purpose |
|---------|---------|
| `drizzle-orm` | Type-safe ORM for PostgreSQL |
| `drizzle-zod` | Auto-generate Zod schemas from Drizzle tables |
| `orval` | Generates TanStack Query hooks from OpenAPI spec |
| `express` | HTTP server framework |
| `pino` / `pino-http` | Structured JSON logging |
| `react` + `vite` | Frontend framework & build tool |
| `wouter` | Minimal client-side router |
| `@tanstack/react-query` | Server state / data fetching |
| `recharts` | Chart components (trend lines, area charts) |
| `tailwindcss` | Utility-first CSS |
| `shadcn/ui` | Accessible component primitives |
| `date-fns` | Date formatting |
| `lucide-react` | Icons |
