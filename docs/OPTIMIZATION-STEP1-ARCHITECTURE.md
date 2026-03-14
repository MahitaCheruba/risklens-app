# Step 1: Optimization Engine – Architecture & Inspection

## Where the current simulation entry point is

- **File:** `src/lib/monteCarlo.ts`
- **Function:** `runMonteCarlo(inputs: ScenarioInputs): SimulationResult`
- **Called from:**
  - `src/app/scenarios/[id]/page.tsx` — when the user clicks "Run simulation" (`handleRunSimulation`)
  - `src/lib/analytics.ts` — inside `runSensitivityAnalysis()` for each varied input

The simulation is the single source of truth: it takes `ScenarioInputs` (including `sellingPrice`) and returns profits, mean, stdDev, percentile5, percentile95, probabilityOfLoss. No duplication of simulation logic.

---

## Which files are responsible for the results page

- **Results page:** `src/app/scenarios/[id]/page.tsx`
  - Loads one scenario by `id` from InstantDB.
  - Derives `inputs` via `scenarioToInputs(scenario)` (same shape as `ScenarioInputs`).
  - On "Run simulation": calls `runMonteCarlo(inputs)`, then `runSensitivityAnalysis(inputs)` in a timeout.
  - Renders, when `result` exists: Executive summary, Download Report, Summary metrics, Profit histogram, Sensitivity analysis, Recommendation box.
- **Supporting components:** ExecutiveSummary, MetricsSummary, ProfitHistogram, TornadoChart, RecommendationBox; data from `src/lib/analytics.ts` (breakEvenDemand, buildRecommendationText, runSensitivityAnalysis).

---

## Which files should be changed for the optimization engine

1. **New file:** `src/lib/optimization.ts`
   - Reusable optimization utility: grid search over selling price.
   - Imports only `runMonteCarlo` and `ScenarioInputs` from `monteCarlo.ts`; no changes to `monteCarlo.ts` or `analytics.ts`.
2. **Modify:** `src/app/scenarios/[id]/page.tsx`
   - Add state for optimization (min/max/step, result, loading).
   - Add an "Optimization" section (inputs + "Run Optimization" button + best recommendation + top 5 table + short interpretation).
   - Reuse existing `inputs` from the same scenario; optimization runs in the background without changing the main simulation result, sensitivity, or recommendation.

---

## Cleanest architecture for this feature

- **Single-variable, selling-price only (v1):** A thin optimization layer that:
  - Takes base `ScenarioInputs` and a price range (min, max, step).
  - Builds a list of candidate prices; for each, runs `runMonteCarlo({ ...baseInputs, sellingPrice: price })`.
  - Aggregates per-candidate metrics (expected profit, probability of loss, probability of profit, percentile range from `SimulationResult`).
  - Sorts by expected profit (desc); returns the best and top N (e.g. top 5).
- **Modular for later:** Types and function signature can later support other variables (e.g. variable cost, demand mean) or multi-variable search without changing the scenario page flow. The UI only consumes "best option" and "top options" plus a short interpretation.

No refactors to scenario comparison, sensitivity, recommendation, or executive summary — only additive code.
