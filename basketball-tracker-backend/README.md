# Basketball Tracker Backend

Production-ready Python Flask REST API for basketball player performance tracking and athletic development analytics.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼──────────────────────────────┐
│                  Flask REST API (app.py)                 │
│              Flask-CORS · Flask-Migrate                  │
│                                                          │
│  /api/players   /api/games   /api/stats                  │
│  /api/athletic-metrics       /api/analytics              │
└────────────┬───────────────────────────────┬────────────┘
             │                               │
┌────────────▼────────────┐  ┌──────────────▼────────────┐
│     routes/ (API layer) │  │  services/ (business logic)│
│  players.py             │  │  stats_service.py          │
│  games.py               │  │  athletic_service.py       │
│  basketball_stats.py    │  │  analytics_service.py      │
│  athletic_metrics.py    │  └──────────────┬────────────┘
│  analytics.py           │                 │
└─────────────────────────┘  ┌──────────────▼────────────┐
                             │  models.py (SQLAlchemy ORM)│
                             │  db.py (SQLAlchemy + Alembic│
                             └──────────────┬────────────┘
                                            │
                             ┌──────────────▼────────────┐
                             │  Database                  │
                             │  SQLite (dev) / PostgreSQL │
                             └───────────────────────────┘
```

---

## Database Schema

```
players
───────
id           PK
name
team
position     PG/SG/SF/PF/C
jersey_number
season
height_cm
weight_kg
date_of_birth
created_at
updated_at
    │
    ├──< basketball_stats
    │       id           PK
    │       player_id    FK → players.id
    │       game_id      FK → games.id
    │       points, assists, rebounds, steals, blocks
    │       turnovers, minutes_played
    │       field_goals_made/attempted
    │       threes_made/attempted
    │       free_throws_made/attempted
    │       plus_minus
    │       UNIQUE(player_id, game_id)
    │
    └──< athletic_metrics
            id              PK
            player_id       FK → players.id
            metric_type_id  FK → metric_types.id
            value
            recorded_at     DATE
            notes

games
─────
id, date, opponent, home_away, result, team_score, opponent_score

metric_types  (catalogue / lookup table)
────────────
id, slug (unique), label, category, unit, higher_is_better, description
```

---

## Folder Structure

```
basketball-tracker-backend/
│
├── app.py                  # Application factory (create_app)
├── db.py                   # SQLAlchemy + Flask-Migrate binding
├── models.py               # All ORM models
├── seed.py                 # Development data seeder
│
├── routes/
│   ├── __init__.py
│   ├── players.py          # GET/POST/PUT/DELETE /api/players
│   ├── games.py            # GET/POST/DELETE /api/games
│   ├── basketball_stats.py # GET/POST /api/stats + averages
│   ├── athletic_metrics.py # POST/GET /api/athletic-metrics + progression
│   └── analytics.py       # GET /api/analytics/...
│
├── services/
│   ├── __init__.py
│   ├── stats_service.py    # Efficiency, averages, rolling form, consistency
│   ├── athletic_service.py # Progression curves, improvement rate, volatility
│   └── analytics_service.py # Cross-domain aggregation, leaderboard
│
├── config/
│   ├── __init__.py
│   └── config.py           # DevelopmentConfig / ProductionConfig / TestingConfig
│
├── migrations/             # Alembic migrations (auto-managed by Flask-Migrate)
│   └── env.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Setup (Development)

```bash
# 1. Clone and create virtual environment
git clone <repo>
cd basketball-tracker-backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — leave DATABASE_URL blank for SQLite

# 4. Initialize database + migrations
export FLASK_APP=app.py
export FLASK_ENV=development
flask db init        # only first time
flask db migrate -m "initial schema"
flask db upgrade

# 5. Seed with sample data
python seed.py

# 6. Run dev server
flask run
# → http://localhost:5000
```

---

## REST API Reference

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/players/` | List all players |
| POST   | `/api/players/` | Create player |
| GET    | `/api/players/<id>` | Get player |
| PUT    | `/api/players/<id>` | Update player |
| DELETE | `/api/players/<id>` | Delete player |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/games/` | List all games |
| POST   | `/api/games/` | Create game |
| GET    | `/api/games/<id>` | Get game |
| DELETE | `/api/games/<id>` | Delete game |

### Basketball Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/stats/` | List all stat entries |
| POST   | `/api/stats/` | Record per-game stats |
| GET    | `/api/stats/player/<id>` | All stats for a player |
| GET    | `/api/stats/player/<id>/averages` | Computed averages + efficiency |

### Athletic Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/athletic-metrics/types` | List metric type catalogue |
| POST   | `/api/athletic-metrics/types` | Add metric type |
| POST   | `/api/athletic-metrics/player/<id>` | Record metric entry |
| GET    | `/api/athletic-metrics/player/<id>` | All entries for player (filterable) |
| GET    | `/api/athletic-metrics/player/<id>/progression/<slug>` | Time-series + improvement analytics |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/analytics/players/<id>` | Full player analytics (basketball + athletic) |
| GET    | `/api/analytics/leaderboard` | All players ranked by efficiency |
| GET    | `/api/analytics/team-summary` | Team-level aggregates |

---

## Analytics Formulas

**Efficiency Rating**
```
EFF = PTS + REB + AST + STL + BLK
      - TOV
      - (FGA - FGM)
      - (FTA - FTM)
```

**Consistency Score (0–100)**
```
CV  = stddev(values) / mean(values) × 100
Score = max(0, 100 − CV)
```
Higher = more consistent. Works for both basketball (points per game) and athletic metrics.

**Athletic Improvement Rate**
```
rate = (latest_value − first_value) / days_elapsed
```
Units: per day. Respects `higher_is_better` flag per metric type.

---

## Migrating SQLite → PostgreSQL

```bash
# 1. Install PostgreSQL driver (already in requirements.txt)
pip install psycopg2-binary

# 2. Set DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/basketball_tracker

# 3. Re-run migrations against new DB
flask db upgrade

# 4. (Optional) Seed from scratch or migrate data via pg_dump / custom ETL
```

No SQLAlchemy model changes are required — the ORM is fully database-agnostic.

**Production engine settings** (already in `ProductionConfig`):
- `pool_size=10`, `max_overflow=20` — concurrent connection pooling
- `pool_pre_ping=True` — auto-reconnect on stale connections
- `pool_recycle=300` — recycle connections every 5 minutes

---

## Production Deployment (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
```

Recommended: Nginx in front of gunicorn, DATABASE_URL pointing to managed PostgreSQL (Railway, Supabase, RDS).
