import { Priority } from '../models/types';

export function calculatePriorityScore(
  demandScore: number,
  populationImpactScore: number,
  infraGapScore: number,
  investmentScore: number = 50.0
): { priorityScore: number; priority: Priority } {
  const investmentDeficit = Math.max(0.0, 100.0 - investmentScore);

  // Weights: Demand (35%), Population Impact (30%), Infrastructure Deficit (25%), Investment Deficit (10%)
  const composite =
    demandScore * 0.35 +
    populationImpactScore * 0.3 +
    infraGapScore * 0.25 +
    investmentDeficit * 0.1;

  let priority: Priority = 'low';
  if (composite >= 80.0) {
    priority = 'critical';
  } else if (composite >= 65.0) {
    priority = 'high';
  } else if (composite >= 45.0) {
    priority = 'medium';
  }

  return {
    priorityScore: Math.round(composite * 10) / 10,
    priority,
  };
}
