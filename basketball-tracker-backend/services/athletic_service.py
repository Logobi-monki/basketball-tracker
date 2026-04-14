"""
Athletic development service.

Handles:
  - progression time-series (for charts)
  - improvement rate computation
  - personal bests
  - volatility / consistency across test sessions
"""

import math
from models import AthleticMetric, MetricType
from db import db


class AthleticService:

    @staticmethod
    def compute_progression(player_id: int, metric_type_id: int) -> dict:
        """
        Returns a chart-ready time-series with progression analytics.

        Response shape:
        {
          "metric_type": {...},
          "series": [{"date": "...", "value": 1.23}, ...],
          "personal_best": 1.23,
          "first_value": 1.0,
          "latest_value": 1.23,
          "total_improvement": +0.23,        # latest - first
          "improvement_pct": 23.0,           # % change first→latest
          "improvement_rate": +0.015,        # average gain per day
          "volatility": 4.2,                 # stddev of values
          "consistency_score": 87.3,         # 0–100, inverse of CV
          "trend": "improving" | "declining" | "stable",
        }
        """
        mt: MetricType = MetricType.query.get_or_404(metric_type_id)
        entries = (
            AthleticMetric.query
            .filter_by(player_id=player_id, metric_type_id=metric_type_id)
            .order_by(AthleticMetric.recorded_at)
            .all()
        )

        series = [{"date": e.recorded_at.isoformat(), "value": e.value, "notes": e.notes}
                  for e in entries]

        if not entries:
            return {
                "metric_type": mt.to_dict(),
                "series": [],
                "personal_best": None,
                "first_value": None,
                "latest_value": None,
                "total_improvement": None,
                "improvement_pct": None,
                "improvement_rate": None,
                "volatility": None,
                "consistency_score": None,
                "trend": "insufficient_data",
            }

        values = [e.value for e in entries]
        first = values[0]
        latest = values[-1]
        pb = max(values) if mt.higher_is_better else min(values)
        improvement = latest - first
        improvement_pct = round((improvement / abs(first)) * 100, 2) if first != 0 else 0.0

        # Rate of improvement per day
        if len(entries) > 1:
            days_elapsed = (entries[-1].recorded_at - entries[0].recorded_at).days
            rate = round(improvement / days_elapsed, 4) if days_elapsed > 0 else 0.0
        else:
            rate = 0.0

        volatility = round(_stddev(values), 3)
        consistency = _consistency(values)
        trend = _trend_label(improvement, mt.higher_is_better)

        return {
            "metric_type": mt.to_dict(),
            "series": series,
            "personal_best": pb,
            "first_value": first,
            "latest_value": latest,
            "total_improvement": round(improvement, 3),
            "improvement_pct": improvement_pct,
            "improvement_rate": rate,
            "volatility": volatility,
            "consistency_score": consistency,
            "trend": trend,
        }

    @staticmethod
    def category_summary(player_id: int) -> dict:
        """
        Returns the latest entry per metric grouped by category.
        Useful for a radar/overview view.
        """
        entries = (
            AthleticMetric.query
            .filter_by(player_id=player_id)
            .join(MetricType)
            .order_by(AthleticMetric.recorded_at.desc())
            .all()
        )

        seen: set[int] = set()
        summary: dict[str, list] = {}
        for entry in entries:
            if entry.metric_type_id in seen:
                continue
            seen.add(entry.metric_type_id)
            cat = entry.metric_type.category
            summary.setdefault(cat, []).append({
                "slug": entry.metric_type.slug,
                "label": entry.metric_type.label,
                "value": entry.value,
                "unit": entry.metric_type.unit,
                "recorded_at": entry.recorded_at.isoformat(),
            })

        return summary


# ── Helpers ──────────────────────────────────────────────────────────────────

def _stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))


def _consistency(values: list[float]) -> float:
    if len(values) < 2:
        return 100.0
    mean = sum(values) / len(values)
    if mean == 0:
        return 100.0
    cv = (_stddev(values) / abs(mean)) * 100
    return round(max(0.0, 100.0 - cv), 1)


def _trend_label(improvement: float, higher_is_better: bool) -> str:
    threshold = 0.01
    if abs(improvement) < threshold:
        return "stable"
    is_positive = improvement > 0
    return "improving" if (is_positive == higher_is_better) else "declining"
