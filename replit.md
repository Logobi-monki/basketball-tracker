# Workspace

## Overview

Basketball player performance tracking web application — Hoops Analytics. A full-stack dashboard for coaches and scouts to track player stats, compute efficiency metrics, and visualize game-by-game trends.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Routing**: wouter

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

- **hoops-dashboard** (`artifacts/hoops-dashboard/`) — React frontend dashboard at `/`
- **api-server** (`artifacts/api-server/`) — Express REST API at `/api`

## Database Schema

- **players** — player roster (name, team, position, number, season)
- **games** — game schedule/results (date, opponent, homeAway, result, scores)
- **stats** — per-game player statistics linked to player_id + game_id

## API Endpoints

- `GET /api/players` — list all players
- `POST /api/players` — create player
- `GET /api/players/:id` — get player
- `PUT /api/players/:id` — update player
- `DELETE /api/players/:id` — delete player
- `GET /api/players/:id/stats` — get all game stats for a player
- `GET /api/players/:id/analytics` — computed analytics (PPG, APG, RPG, efficiency, consistency, fatigue)
- `GET /api/players/:id/trend` — game-by-game performance trend
- `GET /api/games` — list all games
- `POST /api/games` — create game
- `GET /api/stats` — list all stats
- `POST /api/stats` — record a stat entry
- `GET /api/analytics/leaderboard` — ranked leaderboard by efficiency
- `GET /api/analytics/team-summary` — team-level aggregate stats

## Analytics Computed

- PPG, APG, RPG, SPG, BPG, TPG, MPG
- Field goal %, 3-point %, free throw %
- Efficiency rating = PTS + REB + AST + STL + BLK - TOV - (FGA - FGM) - (FTA - FTM)
- Consistency score (variance-based, higher = more consistent)
- Fatigue index (based on recent minutes played)
- Last 5 games rolling averages

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
