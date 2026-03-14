# Step 5: Files changed for Optimization Engine

## New files

| File | Why |
|------|-----|
| `src/lib/optimization.ts` | Reusable single-variable (selling price) optimization: grid search, `runPriceGridSearch()`, types `PriceCandidateResult` and `PriceOptimizationResult`. Calls existing `runMonteCarlo()` only; no simulation logic duplicated. |
| `docs/OPTIMIZATION-STEP1-ARCHITECTURE.md` | Step 1 written summary: where simulation lives, results page, which files to change, architecture. |
| `docs/OPTIMIZATION-FILES-CHANGED.md` | This list. |

## Modified files

| File | Why |
|------|-----|
| `src/app/scenarios/[id]/page.tsx` | Added optimization state (result, loading, min/max/step); `useEffect` to default min/max/step from scenario selling price; `handleRunOptimization` calling `runPriceGridSearch`; Optimization section in the results block (inputs, Run Optimization button, recommended price card, top 5 table, short interpretation). No changes to simulation run, sensitivity, recommendation, or executive summary. |

## Unchanged (verified)

- `src/lib/monteCarlo.ts` — not modified.
- `src/lib/analytics.ts` — not modified.
- `src/lib/scenarioComparison.ts` — not modified.
- Scenario comparison page, ExecutiveSummary, RecommendationBox, TornadoChart, MetricsSummary, report generator — not modified. Optimization is additive on the scenario detail page only.
