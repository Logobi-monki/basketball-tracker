"""
Cross-domain analytics service.

Aggregates basketball + athletic data to produce:
  - full player analytics profile
  - team leaderboard
  - team summary stats
"""

from models import Player, BasketballStat, AthleticMetric, MetricType
from db import db
from services.stats_service import StatsService, _sum_stats, _round, _pct, _consistency
from services.athletic_service import AthleticService


class AnalyticsService:

    @staticmethod
    def full_player_analytics(player_id: int) -> dict:
        """
        Returns a combined analytics payload including:
          - basketball averages
          - performance trend (chart data)
          - athletic category summary
        """
        return {
            "player_id": player_id,
            "basketball": StatsService.compute_averages(player_id),
            "trend": StatsService.trend(player_id),
            "athletic": AthleticService.category_summary(player_id),
        }

    @staticmethod
    def leaderboard() -> list[dict]:
        """
        Returns all players ranked by efficiency rating descending.
        """
        players = Player.query.order_by(Player.name).all()
        rows = []
        for player in players:
            stats = (
                BasketballStat.query
                .filter_by(player_id=player.id)
                .all()
            )
            if not stats:
                continue
            n = len(stats)
            totals = _sum_stats(stats)
            eff_vals = [
                (s.points + s.rebounds + s.assists + s.steals + s.blocks
                 - s.turnovers
                 - (s.field_goals_attempted - s.field_goals_made)
                 - (s.free_throws_attempted - s.free_throws_made))
                for s in stats
            ]
            rows.append({
                "player_id": player.id,
                "player_name": player.name,
                "team": player.team,
                "position": player.position,
                "games_played": n,
                "ppg": _round(totals["points"] / n),
                "apg": _round(totals["assists"] / n),
                "rpg": _round(totals["rebounds"] / n),
                "efficiency_rating": _round(sum(eff_vals) / n),
            })

        return sorted(rows, key=lambda r: r["efficiency_rating"], reverse=True)

    @staticmethod
    def team_summary() -> dict:
        players = Player.query.all()
        all_agg = []
        for p in players:
            stats = BasketballStat.query.filter_by(player_id=p.id).all()
            if not stats:
                continue
            n = len(stats)
            totals = _sum_stats(stats)
            all_agg.append({
                "name": p.name,
                "ppg": totals["points"] / n,
                "apg": totals["assists"] / n,
                "rpg": totals["rebounds"] / n,
            })

        if not all_agg:
            return {
                "total_players": len(players),
                "total_games": 0,
                "avg_ppg": 0,
                "avg_apg": 0,
                "avg_rpg": 0,
                "top_scorer": None,
                "top_assister": None,
                "top_rebounder": None,
            }

        from models import Game
        total_games = Game.query.count()
        m = len(all_agg)

        return {
            "total_players": len(players),
            "total_games": total_games,
            "avg_ppg": _round(sum(a["ppg"] for a in all_agg) / m),
            "avg_apg": _round(sum(a["apg"] for a in all_agg) / m),
            "avg_rpg": _round(sum(a["rpg"] for a in all_agg) / m),
            "top_scorer": max(all_agg, key=lambda a: a["ppg"])["name"],
            "top_assister": max(all_agg, key=lambda a: a["apg"])["name"],
            "top_rebounder": max(all_agg, key=lambda a: a["rpg"])["name"],
        }
