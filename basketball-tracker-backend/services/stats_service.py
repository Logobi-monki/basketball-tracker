"""
Basketball statistics service.

Handles all computation that should not live in routes:
  - per-season averages
  - efficiency rating
  - last-N-games rolling form
  - season totals
"""

import math
from models import BasketballStat, Game
from db import db
from sqlalchemy import func


class StatsService:

    # ── Efficiency formula (NBA-style) ───────────────────────────────────────
    @staticmethod
    def _efficiency(s: BasketballStat) -> float:
        missed_fg = s.field_goals_attempted - s.field_goals_made
        missed_ft = s.free_throws_attempted - s.free_throws_made
        return (
            s.points + s.rebounds + s.assists + s.steals + s.blocks
            - s.turnovers - missed_fg - missed_ft
        )

    # ── Compute averages for a player ────────────────────────────────────────
    @staticmethod
    def compute_averages(player_id: int) -> dict:
        stats = (
            BasketballStat.query
            .filter_by(player_id=player_id)
            .join(Game)
            .order_by(Game.date)
            .all()
        )

        n = len(stats)
        if n == 0:
            return _empty_averages(player_id)

        totals = _sum_stats(stats)
        efficiency_values = [StatsService._efficiency(s) for s in stats]

        last5 = stats[-5:]
        last5_totals = _sum_stats(last5)
        n5 = len(last5)

        return {
            "player_id": player_id,
            "games_played": n,
            "ppg": _round(totals["points"] / n),
            "apg": _round(totals["assists"] / n),
            "rpg": _round(totals["rebounds"] / n),
            "spg": _round(totals["steals"] / n),
            "bpg": _round(totals["blocks"] / n),
            "tpg": _round(totals["turnovers"] / n),
            "mpg": _round(totals["minutes_played"] / n),
            "fg_pct": _pct(totals["fgm"], totals["fga"]),
            "three_pct": _pct(totals["3pm"], totals["3pa"]),
            "ft_pct": _pct(totals["ftm"], totals["fta"]),
            "plus_minus_avg": _round(totals["plus_minus"] / n),
            "efficiency_rating": _round(sum(efficiency_values) / n),
            "consistency_score": _consistency(efficiency_values),
            "last_5": {
                "ppg": _round(last5_totals["points"] / n5),
                "apg": _round(last5_totals["assists"] / n5),
                "rpg": _round(last5_totals["rebounds"] / n5),
            },
            "season_totals": {
                "points": totals["points"],
                "assists": totals["assists"],
                "rebounds": totals["rebounds"],
                "steals": totals["steals"],
                "blocks": totals["blocks"],
                "turnovers": totals["turnovers"],
            },
        }

    # ── Game-by-game trend (for charts) ─────────────────────────────────────
    @staticmethod
    def trend(player_id: int) -> list[dict]:
        stats = (
            BasketballStat.query
            .filter_by(player_id=player_id)
            .join(Game)
            .order_by(Game.date)
            .all()
        )
        return [
            {
                "game_id": s.game_id,
                "date": s.game.date.isoformat(),
                "opponent": s.game.opponent,
                "points": s.points,
                "assists": s.assists,
                "rebounds": s.rebounds,
                "efficiency": StatsService._efficiency(s),
                "plus_minus": s.plus_minus,
            }
            for s in stats
        ]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _empty_averages(player_id: int) -> dict:
    return {
        "player_id": player_id,
        "games_played": 0,
        "ppg": 0, "apg": 0, "rpg": 0, "spg": 0, "bpg": 0, "tpg": 0, "mpg": 0,
        "fg_pct": 0, "three_pct": 0, "ft_pct": 0,
        "plus_minus_avg": 0, "efficiency_rating": 0, "consistency_score": 0,
        "last_5": {"ppg": 0, "apg": 0, "rpg": 0},
        "season_totals": {"points": 0, "assists": 0, "rebounds": 0,
                          "steals": 0, "blocks": 0, "turnovers": 0},
    }


def _sum_stats(stats: list[BasketballStat]) -> dict:
    return {
        "points": sum(s.points for s in stats),
        "assists": sum(s.assists for s in stats),
        "rebounds": sum(s.rebounds for s in stats),
        "steals": sum(s.steals for s in stats),
        "blocks": sum(s.blocks for s in stats),
        "turnovers": sum(s.turnovers for s in stats),
        "minutes_played": sum(s.minutes_played for s in stats),
        "fgm": sum(s.field_goals_made for s in stats),
        "fga": sum(s.field_goals_attempted for s in stats),
        "3pm": sum(s.threes_made for s in stats),
        "3pa": sum(s.threes_attempted for s in stats),
        "ftm": sum(s.free_throws_made for s in stats),
        "fta": sum(s.free_throws_attempted for s in stats),
        "plus_minus": sum(s.plus_minus for s in stats),
    }


def _round(val: float, dp: int = 1) -> float:
    return round(val, dp)


def _pct(made: int, attempted: int) -> float:
    return round(made / attempted * 100, 1) if attempted > 0 else 0.0


def _consistency(values: list[float]) -> float:
    """
    Returns a 0–100 score where 100 = perfectly consistent.
    Based on coefficient of variation: CV = stddev / mean * 100
    Score = max(0, 100 - CV)
    """
    if len(values) < 2:
        return 100.0
    mean = sum(values) / len(values)
    if mean == 0:
        return 100.0
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    stddev = math.sqrt(variance)
    cv = (stddev / abs(mean)) * 100
    return round(max(0.0, 100.0 - cv), 1)
