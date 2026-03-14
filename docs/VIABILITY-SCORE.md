# Business Viability Score

## Overview

The **Business Viability Score** is a 0–100 summary of scenario attractiveness, computed from existing simulation outputs. No Monte Carlo or optimization logic is changed.

## Calculation

- **Profit attractiveness (40%)**: Higher expected profit → higher sub-score. Normalized 0–100.
- **Risk level (30%)**: Lower probability of loss → higher sub-score. `100 - P(loss)`.
- **Break-even feasibility (20%)**: Achievable = 100, not achievable = 0.
- **Volatility (10%)**: Lower standard deviation (relative to a reference) → higher sub-score.

The weighted sum is clamped to 0–100 and rounded.

## Status labels

| Score   | Label            |
|---------|------------------|
| 80–100  | Attractive       |
| 60–80   | Moderate         |
| 40–60   | Risky            |
| &lt;40  | Not recommended  |

## Files

- **src/lib/viabilityScore.ts** — `computeViabilityScore(inputs)` and types. Pure function; no UI.
- **src/components/BusinessViabilityScore.tsx** — Section with gauge, score, label, interpretation text.
- **src/app/scenarios/[id]/page.tsx** — `viabilityResult` from `useMemo(computeViabilityScore(...))`; renders `BusinessViabilityScore` at top of results when `result` exists.

## How to test locally

1. Run the app: `npm run dev`.
2. Open a scenario and click **Run simulation**.
3. At the top of the results (above Key metrics) you should see **Business Viability Score** with:
   - A gauge (red / yellow / green zones) and needle at the score.
   - Numeric score (e.g. **72/100**).
   - Status label (e.g. **Moderate**).
   - Short interpretation paragraph.
4. Try different scenarios (e.g. very low price, high fixed cost) to see scores in different bands (Attractive / Moderate / Risky / Not recommended).
