"""
Application factory.

Usage
─────
    FLASK_ENV=development flask run

    # or with gunicorn in production:
    gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config.config import get_config
from db import init_db

# Import models so Alembic can discover them
import models  # noqa: F401

from routes.players import players_bp
from routes.games import games_bp
from routes.basketball_stats import basketball_stats_bp
from routes.athletic_metrics import athletic_metrics_bp
from routes.analytics import analytics_bp


def create_app(config_override=None):
    app = Flask(__name__)

    # ── Config ──────────────────────────────────────────────────────────────
    cfg = config_override or get_config()
    app.config.from_object(cfg)

    # ── Extensions ──────────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    init_db(app)

    # ── Blueprints ──────────────────────────────────────────────────────────
    app.register_blueprint(players_bp,          url_prefix="/api/players")
    app.register_blueprint(games_bp,            url_prefix="/api/games")
    app.register_blueprint(basketball_stats_bp, url_prefix="/api/stats")
    app.register_blueprint(athletic_metrics_bp, url_prefix="/api/athletic-metrics")
    app.register_blueprint(analytics_bp,        url_prefix="/api/analytics")

    # ── Health check ────────────────────────────────────────────────────────
    @app.get("/api/healthz")
    def health():
        return jsonify({"status": "ok"}), 200

    # ── Global error handlers ───────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"error": "Unprocessable entity", "detail": str(e)}), 422

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000)
