"""
Development seed script.

Usage:
    FLASK_ENV=development python seed.py

Creates metric types + sample player + games + stats + athletic metrics.
Safe to run multiple times (checks for existing data).
"""

from datetime import date
from app import create_app
from db import db
from models import Player, Game, BasketballStat, MetricType, AthleticMetric

METRIC_TYPES = [
    # Jump
    dict(slug="vertical_jump",         label="Vertical Jump",         category="jump",        unit="cm",  higher_is_better=True),
    dict(slug="standing_vertical",     label="Standing Vertical",     category="jump",        unit="cm",  higher_is_better=True),
    dict(slug="running_vertical",      label="Running Vertical",      category="jump",        unit="cm",  higher_is_better=True),
    dict(slug="broad_jump",            label="Broad Jump",            category="jump",        unit="cm",  higher_is_better=True),
    # Speed
    dict(slug="sprint_10m",            label="10m Sprint",            category="speed",       unit="sec", higher_is_better=False),
    dict(slug="sprint_20m",            label="20m Sprint",            category="speed",       unit="sec", higher_is_better=False),
    dict(slug="full_court_sprint",     label="Full Court Sprint",     category="speed",       unit="sec", higher_is_better=False),
    dict(slug="agility_drill",         label="Agility Drill",         category="speed",       unit="sec", higher_is_better=False),
    # Strength
    dict(slug="squat_max",             label="Squat Max",             category="strength",    unit="kg",  higher_is_better=True),
    dict(slug="bench_press",           label="Bench Press",           category="strength",    unit="kg",  higher_is_better=True),
    dict(slug="deadlift",              label="Deadlift",              category="strength",    unit="kg",  higher_is_better=True),
    # Conditioning
    dict(slug="beep_test",             label="Beep Test Level",       category="conditioning", unit="level", higher_is_better=True),
    dict(slug="vo2_estimate",          label="VO2 Max Estimate",      category="conditioning", unit="ml/kg/min", higher_is_better=True),
    dict(slug="fatigue_score",         label="Fatigue Score",         category="conditioning", unit="score", higher_is_better=False),
]

GAMES = [
    dict(date=date(2025, 1, 5),  opponent="Eastside Eagles",   home_away="home", result="W", team_score=108, opponent_score=97),
    dict(date=date(2025, 1, 9),  opponent="Downtown Blazers",  home_away="away", result="L", team_score=91,  opponent_score=99),
    dict(date=date(2025, 1, 14), opponent="Northside Knights", home_away="home", result="W", team_score=115, opponent_score=103),
    dict(date=date(2025, 1, 18), opponent="Southpark Bulls",   home_away="away", result="W", team_score=102, opponent_score=98),
    dict(date=date(2025, 1, 23), opponent="Riverside Raptors", home_away="home", result="W", team_score=121, opponent_score=110),
]

MARCUS_STATS = [
    # pts  ast reb stl blk tov  min  fgm fga  3m  3a ftm fta  pm
    (28,   8,  4,  2,  0,  3,  34.0, 11, 15,  4, 10,  8, 10, +12),
    (19,  10,  3,  1,  0,  4,  29.0,  7, 16,  2,  8,  5,  6,  -6),
    (31,   7,  5,  3,  1,  2,  36.0, 11, 19,  5, 12,  9, 11, +18),
    (24,   9,  4,  2,  0,  3,  32.0,  9, 18,  3,  9,  6,  8,  +8),
    (35,   6,  6,  2,  0,  2,  38.0, 13, 22,  5, 13,  9, 10, +15),
]

MARCUS_ATHLETICS = [
    # slug                value   date
    ("vertical_jump",    68.0,  date(2025, 1, 2)),
    ("vertical_jump",    70.5,  date(2025, 2, 5)),
    ("vertical_jump",    71.0,  date(2025, 3, 1)),
    ("sprint_10m",        1.72, date(2025, 1, 2)),
    ("sprint_10m",        1.68, date(2025, 2, 5)),
    ("squat_max",       140.0,  date(2025, 1, 2)),
    ("squat_max",       150.0,  date(2025, 2, 5)),
    ("squat_max",       155.0,  date(2025, 3, 1)),
    ("beep_test",        13.5,  date(2025, 1, 2)),
    ("beep_test",        14.2,  date(2025, 2, 5)),
]


def run():
    app = create_app()
    with app.app_context():
        db.create_all()

        # Metric types
        for mt_data in METRIC_TYPES:
            if not MetricType.query.filter_by(slug=mt_data["slug"]).first():
                db.session.add(MetricType(**mt_data))
        db.session.commit()
        print(f"[seed] {MetricType.query.count()} metric types")

        # Player
        if not Player.query.filter_by(name="Marcus Johnson").first():
            marcus = Player(
                name="Marcus Johnson",
                team="Westside Wolves",
                position="PG",
                jersey_number=3,
                season="2024-25",
                height_cm=193.0,
                weight_kg=88.5,
            )
            db.session.add(marcus)
            db.session.commit()
        marcus = Player.query.filter_by(name="Marcus Johnson").first()
        print(f"[seed] player id={marcus.id}")

        # Games
        game_ids = []
        for gd in GAMES:
            existing = Game.query.filter_by(date=gd["date"], opponent=gd["opponent"]).first()
            if not existing:
                g = Game(**gd)
                db.session.add(g)
                db.session.commit()
                game_ids.append(g.id)
            else:
                game_ids.append(existing.id)
        print(f"[seed] {len(game_ids)} games")

        # Basketball stats
        for i, (g_id, row) in enumerate(zip(game_ids, MARCUS_STATS)):
            if not BasketballStat.query.filter_by(player_id=marcus.id, game_id=g_id).first():
                pts, ast, reb, stl, blk, tov, mpg, fgm, fga, tm, ta, ftm, fta, pm = row
                db.session.add(BasketballStat(
                    player_id=marcus.id, game_id=g_id,
                    points=pts, assists=ast, rebounds=reb, steals=stl, blocks=blk, turnovers=tov,
                    minutes_played=mpg,
                    field_goals_made=fgm, field_goals_attempted=fga,
                    threes_made=tm, threes_attempted=ta,
                    free_throws_made=ftm, free_throws_attempted=fta,
                    plus_minus=pm,
                ))
        db.session.commit()
        print(f"[seed] basketball stats seeded")

        # Athletic metrics
        type_map = {mt.slug: mt.id for mt in MetricType.query.all()}
        for slug, value, rec_date in MARCUS_ATHLETICS:
            if not AthleticMetric.query.filter_by(
                player_id=marcus.id, metric_type_id=type_map[slug], recorded_at=rec_date
            ).first():
                db.session.add(AthleticMetric(
                    player_id=marcus.id,
                    metric_type_id=type_map[slug],
                    value=value,
                    recorded_at=rec_date,
                ))
        db.session.commit()
        print(f"[seed] athletic metrics seeded")
        print("[seed] done ✓")


if __name__ == "__main__":
    run()
