from flask import Blueprint, jsonify
from models import Player
from services.stats_service import StatsService
from services.athletic_service import AthleticService
from services.analytics_service import AnalyticsService

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/players/<int:player_id>")
def player_analytics(player_id: int):
    Player.query.get_or_404(player_id, description="Player not found")
    data = AnalyticsService.full_player_analytics(player_id)
    return jsonify(data), 200


@analytics_bp.get("/leaderboard")
def leaderboard():
    data = AnalyticsService.leaderboard()
    return jsonify(data), 200


@analytics_bp.get("/team-summary")
def team_summary():
    data = AnalyticsService.team_summary()
    return jsonify(data), 200
