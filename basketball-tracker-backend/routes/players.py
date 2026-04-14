from flask import Blueprint, request, jsonify
from db import db
from models import Player
from datetime import date

players_bp = Blueprint("players", __name__)


def _parse_player_body(data: dict) -> dict:
    dob = data.get("date_of_birth")
    return {
        "name": data["name"],
        "team": data["team"],
        "position": data["position"],
        "jersey_number": int(data["jersey_number"]),
        "season": data.get("season", "2024-25"),
        "height_cm": data.get("height_cm"),
        "weight_kg": data.get("weight_kg"),
        "date_of_birth": date.fromisoformat(dob) if dob else None,
    }


@players_bp.get("/")
def list_players():
    players = Player.query.order_by(Player.name).all()
    return jsonify([p.to_dict() for p in players]), 200


@players_bp.post("/")
def create_player():
    data = request.get_json(force=True)
    required = ("name", "team", "position", "jersey_number")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    player = Player(**_parse_player_body(data))
    db.session.add(player)
    db.session.commit()
    return jsonify(player.to_dict()), 201


@players_bp.get("/<int:player_id>")
def get_player(player_id: int):
    player = Player.query.get_or_404(player_id, description="Player not found")
    return jsonify(player.to_dict()), 200


@players_bp.put("/<int:player_id>")
def update_player(player_id: int):
    player = Player.query.get_or_404(player_id, description="Player not found")
    data = request.get_json(force=True)
    for key, value in _parse_player_body({**player.to_dict(), **data}).items():
        setattr(player, key, value)
    db.session.commit()
    return jsonify(player.to_dict()), 200


@players_bp.delete("/<int:player_id>")
def delete_player(player_id: int):
    player = Player.query.get_or_404(player_id, description="Player not found")
    db.session.delete(player)
    db.session.commit()
    return jsonify({"message": "Player deleted"}), 200
