from flask import Blueprint, request, jsonify
from db import db
from models import Game
from datetime import date

games_bp = Blueprint("games", __name__)


@games_bp.get("/")
def list_games():
    games = Game.query.order_by(Game.date.desc()).all()
    return jsonify([g.to_dict() for g in games]), 200


@games_bp.post("/")
def create_game():
    data = request.get_json(force=True)
    required = ("date", "opponent", "team_score", "opponent_score")
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    game = Game(
        date=date.fromisoformat(data["date"]),
        opponent=data["opponent"],
        home_away=data.get("home_away", "home"),
        result=data.get("result", "W"),
        team_score=int(data["team_score"]),
        opponent_score=int(data["opponent_score"]),
    )
    db.session.add(game)
    db.session.commit()
    return jsonify(game.to_dict()), 201


@games_bp.get("/<int:game_id>")
def get_game(game_id: int):
    game = Game.query.get_or_404(game_id, description="Game not found")
    return jsonify(game.to_dict()), 200


@games_bp.delete("/<int:game_id>")
def delete_game(game_id: int):
    game = Game.query.get_or_404(game_id, description="Game not found")
    db.session.delete(game)
    db.session.commit()
    return jsonify({"message": "Game deleted"}), 200
