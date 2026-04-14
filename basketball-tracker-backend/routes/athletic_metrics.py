from flask import Blueprint, request, jsonify
from db import db
from models import Player, MetricType, AthleticMetric
from services.athletic_service import AthleticService
from datetime import date

athletic_metrics_bp = Blueprint("athletic_metrics", __name__)


# ── Metric type catalogue ────────────────────────────────────────────────────

@athletic_metrics_bp.get("/types")
def list_metric_types():
    types = MetricType.query.order_by(MetricType.category, MetricType.label).all()
    return jsonify([t.to_dict() for t in types]), 200


@athletic_metrics_bp.post("/types")
def create_metric_type():
    data = request.get_json(force=True)
    required = ("slug", "label", "category", "unit")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    mt = MetricType(
        slug=data["slug"],
        label=data["label"],
        category=data["category"],
        unit=data["unit"],
        higher_is_better=data.get("higher_is_better", True),
        description=data.get("description"),
    )
    db.session.add(mt)
    db.session.commit()
    return jsonify(mt.to_dict()), 201


# ── Metric entries ───────────────────────────────────────────────────────────

@athletic_metrics_bp.post("/player/<int:player_id>")
def add_metric(player_id: int):
    Player.query.get_or_404(player_id, description="Player not found")
    data = request.get_json(force=True)
    required = ("metric_type_id", "value", "recorded_at")
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    MetricType.query.get_or_404(data["metric_type_id"], description="Metric type not found")

    entry = AthleticMetric(
        player_id=player_id,
        metric_type_id=data["metric_type_id"],
        value=float(data["value"]),
        recorded_at=date.fromisoformat(data["recorded_at"]),
        notes=data.get("notes"),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@athletic_metrics_bp.get("/player/<int:player_id>")
def get_player_metrics(player_id: int):
    Player.query.get_or_404(player_id, description="Player not found")
    category = request.args.get("category")
    slug = request.args.get("metric_type_slug")

    query = (
        AthleticMetric.query
        .filter_by(player_id=player_id)
        .join(MetricType)
    )
    if category:
        query = query.filter(MetricType.category == category)
    if slug:
        mt = MetricType.query.filter_by(slug=slug).first_or_404()
        query = query.filter(AthleticMetric.metric_type_id == mt.id)

    entries = query.order_by(AthleticMetric.recorded_at).all()
    return jsonify([e.to_dict() for e in entries]), 200


@athletic_metrics_bp.get("/player/<int:player_id>/progression/<slug>")
def get_progression(player_id: int, slug: str):
    Player.query.get_or_404(player_id, description="Player not found")
    mt = MetricType.query.filter_by(slug=slug).first_or_404(description=f"Metric type '{slug}' not found")
    result = AthleticService.compute_progression(player_id, mt.id)
    return jsonify(result), 200
