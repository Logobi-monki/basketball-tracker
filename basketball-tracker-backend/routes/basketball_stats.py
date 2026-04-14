from flask import Blueprint, request, jsonify
from db import db
from models import Player, Game, BasketballStat
from services.stats_service import StatsService

basketball_stats_bp = Blueprint("basketball_stats", __name__)


@basketball_stats_bp.get("/")
def list_stats():
    stats = BasketballStat.query.order_by(BasketballStat.game_id).all()
    return jsonify([s.to_dict(include_game=True) for s in stats]), 200


@basketball_stats_bp.post("/")
def create_stat():
    data = request.get_json(force=True)
    required = ("player_id", "game_id", "points", "assists", "rebounds",
                "steals", "blocks", "turnovers", "minutes_played",
                "field_goals_made", "field_goals_attempted",
                "threes_made", "threes_attempted",
                "free_throws_made", "free_throws_attempted", "plus_minus")
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    Player.query.get_or_404(data["player_id"], description="Player not found")
    Game.query.get_or_404(data["game_id"], description="Game not found")

    stat = BasketballStat(
        player_id=data["player_id"],
        game_id=data["game_id"],
        points=data["points"],
        assists=data["assists"],
        rebounds=data["rebounds"],
        steals=data["steals"],
        blocks=data["blocks"],
        turnovers=data["turnovers"],
        minutes_played=float(data["minutes_played"]),
        field_goals_made=data["field_goals_made"],
        field_goals_attempted=data["field_goals_attempted"],
        threes_made=data["threes_made"],
        threes_attempted=data["threes_attempted"],
        free_throws_made=data["free_throws_made"],
        free_throws_attempted=data["free_throws_attempted"],
        plus_minus=data["plus_minus"],
    )
    db.session.add(stat)
    db.session.commit()
    return jsonify(stat.to_dict(include_game=True)), 201


@basketball_stats_bp.get("/player/<int:player_id>")
def get_player_stats(player_id: int):
    Player.query.get_or_404(player_id, description="Player not found")
    stats = (
        BasketballStat.query
        .filter_by(player_id=player_id)
        .join(Game)
        .order_by(Game.date)
        .all()
    )
    return jsonify([s.to_dict(include_game=True) for s in stats]), 200


@basketball_stats_bp.get("/player/<int:player_id>/averages")
def get_player_averages(player_id: int):
    Player.query.get_or_404(player_id, description="Player not found")
    result = StatsService.compute_averages(player_id)
    return jsonify(result), 200
