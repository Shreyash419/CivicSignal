"""Priority scoring engine combining demand, population impact, and infrastructure gap."""

from typing import Dict, Any


def calculate_priority_score(
    demand_score: float,
    population_impact_score: float,
    infra_gap_score: float,
    investment_score: float = 50.0,
) -> Dict[str, Any]:
    """Calculates multi-dimensional priority score from 0 to 100."""
    # Weights: Demand (35%), Population Impact (30%), Infrastructure Deficit (25%), Investment Deficit (10%)
    investment_deficit = max(0.0, 100.0 - investment_score)

    composite = (
        (demand_score * 0.35)
        + (population_impact_score * 0.30)
        + (infra_gap_score * 0.25)
        + (investment_deficit * 0.10)
    )

    if composite >= 80.0:
        priority_label = "critical"
    elif composite >= 65.0:
        priority_label = "high"
    elif composite >= 45.0:
        priority_label = "medium"
    else:
        priority_label = "low"

    return {
        "priorityScore": round(composite, 1),
        "priority": priority_label,
    }
