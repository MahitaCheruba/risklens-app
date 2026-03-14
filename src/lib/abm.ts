/**
 * Lightweight agent-based adoption model (v1).
 * Customer adoption with word-of-mouth and churn. Modular for future
 * extension (e.g. brand switching, competitor response).
 * Does not use or modify the Monte Carlo engine.
 */

export interface ABMAdoptionInputs {
  numCustomers: number;
  initialAdopters: number;
  /** Base probability per step that a non-adopter adopts (0–1). */
  adoptionProbability: number;
  /** Weight for word-of-mouth: adoption prob += influenceStrength * (adopters/total). */
  influenceStrength: number;
  /** Probability per step that an adopter churns (0–1). */
  churnProbability: number;
  timeSteps: number;
}

export interface ABMAdoptionResult {
  /** Adopters count at end of each step (length = timeSteps + 1, includes t=0). */
  adoptionOverTime: number[];
  /** Adoption rate at final step (0–1). */
  finalAdoptionRate: number;
  /** Total number of churn events across all steps. */
  totalChurnEvents: number;
  /** Final number of adopters. */
  finalAdopters: number;
}

/**
 * Run one agent-based adoption simulation. Each step:
 * 1. Churn: each adopter churns with churnProbability.
 * 2. Adoption: each non-adopter adopts with probability
 *    min(1, adoptionProbability + influenceStrength * (adopters/total)).
 */
export function runAdoptionABM(inputs: ABMAdoptionInputs): ABMAdoptionResult {
  const {
    numCustomers,
    initialAdopters,
    adoptionProbability,
    influenceStrength,
    churnProbability,
    timeSteps,
  } = inputs;

  const n = Math.max(1, Math.floor(numCustomers));
  const steps = Math.max(1, Math.min(500, Math.floor(timeSteps)));
  let adopters = Math.max(0, Math.min(n, Math.floor(initialAdopters)));

  const adoptionOverTime: number[] = [adopters];
  let totalChurnEvents = 0;

  for (let t = 0; t < steps; t++) {
    const adoptionRate = adopters / n;

    // Churn phase: each adopter may churn
    let churned = 0;
    for (let i = 0; i < adopters; i++) {
      if (Math.random() < churnProbability) churned++;
    }
    adopters = Math.max(0, adopters - churned);
    totalChurnEvents += churned;

    // Adoption phase: each non-adopter may adopt (word-of-mouth)
    const pAdopt = Math.min(
      1,
      adoptionProbability + influenceStrength * adoptionRate
    );
    const nonAdopters = n - adopters;
    let newAdopters = 0;
    for (let i = 0; i < nonAdopters; i++) {
      if (Math.random() < pAdopt) newAdopters++;
    }
    adopters = Math.min(n, adopters + newAdopters);

    adoptionOverTime.push(adopters);
  }

  const finalAdoptionRate = n > 0 ? adopters / n : 0;

  return {
    adoptionOverTime,
    finalAdoptionRate,
    totalChurnEvents,
    finalAdopters: adopters,
  };
}
