"""
SQLAlchemy ORM models.

Relationships
─────────────
Player  ──< BasketballStat  (one player → many per-game stats)
Player  ──< AthleticMetric  (one player → many metric entries)
Game    ──< BasketballStat  (one game  → many player stats)
MetricType ──< AthleticMetric (normalized metric catalogue)

Index strategy
──────────────
- FK columns are indexed automatically by SQLAlchemy (most DBs).
- Composite index on (player_id, game_id) in BasketballStat to prevent duplicates
  and speed up per-player game lookups.
- Composite index on (player_id, metric_type_id, recorded_at) in AthleticMetric
  for efficient time-series queries.
"""

from datetime import datetime, timezone
from db import db


def utcnow():
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Player
# ─────────────────────────────────────────────────────────────────────────────

class Player(db.Model):
    __tablename__ = "players"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    team = db.Column(db.String(120), nullable=False)
    position = db.Column(db.String(10), nullable=False)   # PG / SG / SF / PF / C
    jersey_number = db.Column(db.Integer, nullable=False)
    season = db.Column(db.String(10), nullable=False, default="2024-25")
    height_cm = db.Column(db.Float, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    basketball_stats = db.relationship(
        "BasketballStat", back_populates="player", cascade="all, delete-orphan", lazy="dynamic"
    )
    athletic_metrics = db.relationship(
        "AthleticMetric", back_populates="player", cascade="all, delete-orphan", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "team": self.team,
            "position": self.position,
            "jersey_number": self.jersey_number,
            "season": self.season,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Player {self.id} {self.name}>"


# ─────────────────────────────────────────────────────────────────────────────
# Game
# ─────────────────────────────────────────────────────────────────────────────

class Game(db.Model):
    __tablename__ = "games"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    opponent = db.Column(db.String(120), nullable=False)
    home_away = db.Column(db.String(4), nullable=False, default="home")   # "home" | "away"
    result = db.Column(db.String(1), nullable=False, default="W")          # "W" | "L"
    team_score = db.Column(db.Integer, nullable=False)
    opponent_score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    basketball_stats = db.relationship(
        "BasketballStat", back_populates="game", cascade="all, delete-orphan", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "opponent": self.opponent,
            "home_away": self.home_away,
            "result": self.result,
            "team_score": self.team_score,
            "opponent_score": self.opponent_score,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Game {self.id} vs {self.opponent} {self.date}>"


# ─────────────────────────────────────────────────────────────────────────────
# Basketball per-game stats
# ─────────────────────────────────────────────────────────────────────────────

class BasketballStat(db.Model):
    __tablename__ = "basketball_stats"
    __table_args__ = (
        db.UniqueConstraint("player_id", "game_id", name="uq_player_game"),
        db.Index("ix_bball_player_game", "player_id", "game_id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id", ondelete="CASCADE"), nullable=False)

    points = db.Column(db.Integer, nullable=False, default=0)
    assists = db.Column(db.Integer, nullable=False, default=0)
    rebounds = db.Column(db.Integer, nullable=False, default=0)
    steals = db.Column(db.Integer, nullable=False, default=0)
    blocks = db.Column(db.Integer, nullable=False, default=0)
    turnovers = db.Column(db.Integer, nullable=False, default=0)
    minutes_played = db.Column(db.Float, nullable=False, default=0.0)

    field_goals_made = db.Column(db.Integer, nullable=False, default=0)
    field_goals_attempted = db.Column(db.Integer, nullable=False, default=0)
    threes_made = db.Column(db.Integer, nullable=False, default=0)
    threes_attempted = db.Column(db.Integer, nullable=False, default=0)
    free_throws_made = db.Column(db.Integer, nullable=False, default=0)
    free_throws_attempted = db.Column(db.Integer, nullable=False, default=0)
    plus_minus = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    player = db.relationship("Player", back_populates="basketball_stats")
    game = db.relationship("Game", back_populates="basketball_stats")

    def to_dict(self, include_game=False):
        data = {
            "id": self.id,
            "player_id": self.player_id,
            "game_id": self.game_id,
            "points": self.points,
            "assists": self.assists,
            "rebounds": self.rebounds,
            "steals": self.steals,
            "blocks": self.blocks,
            "turnovers": self.turnovers,
            "minutes_played": self.minutes_played,
            "field_goals_made": self.field_goals_made,
            "field_goals_attempted": self.field_goals_attempted,
            "threes_made": self.threes_made,
            "threes_attempted": self.threes_attempted,
            "free_throws_made": self.free_throws_made,
            "free_throws_attempted": self.free_throws_attempted,
            "plus_minus": self.plus_minus,
            "created_at": self.created_at.isoformat(),
        }
        if include_game and self.game:
            data["game"] = self.game.to_dict()
        return data


# ─────────────────────────────────────────────────────────────────────────────
# Metric type catalogue (normalized)
# ─────────────────────────────────────────────────────────────────────────────

class MetricType(db.Model):
    __tablename__ = "metric_types"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(60), nullable=False, unique=True)   # e.g. "vertical_jump"
    label = db.Column(db.String(120), nullable=False)               # e.g. "Vertical Jump"
    category = db.Column(db.String(60), nullable=False)             # jump | speed | strength | conditioning
    unit = db.Column(db.String(20), nullable=False)                 # cm | kg | sec | level
    higher_is_better = db.Column(db.Boolean, nullable=False, default=True)
    description = db.Column(db.Text, nullable=True)

    metrics = db.relationship("AthleticMetric", back_populates="metric_type", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "label": self.label,
            "category": self.category,
            "unit": self.unit,
            "higher_is_better": self.higher_is_better,
            "description": self.description,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Athletic metric entries (time-series)
# ─────────────────────────────────────────────────────────────────────────────

class AthleticMetric(db.Model):
    __tablename__ = "athletic_metrics"
    __table_args__ = (
        db.Index("ix_athletic_player_type_date", "player_id", "metric_type_id", "recorded_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    metric_type_id = db.Column(db.Integer, db.ForeignKey("metric_types.id"), nullable=False)
    value = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    player = db.relationship("Player", back_populates="athletic_metrics")
    metric_type = db.relationship("MetricType", back_populates="metrics")

    def to_dict(self, include_type=True):
        data = {
            "id": self.id,
            "player_id": self.player_id,
            "metric_type_id": self.metric_type_id,
            "value": self.value,
            "recorded_at": self.recorded_at.isoformat(),
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }
        if include_type and self.metric_type:
            data["metric_type"] = self.metric_type.to_dict()
        return data
