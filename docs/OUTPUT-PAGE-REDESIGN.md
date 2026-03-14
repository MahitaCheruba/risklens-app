# Output Page Redesign – Steps 1 & 2

## Step 1: Files to change

| File | Change |
|------|--------|
| **src/app/scenarios/[id]/page.tsx** | Restructure: (1) Top action bar = scenario title + Run Simulation + Download Report. (2) When result exists: single KPI strip (no Executive Overview + Summary metrics duplication). (3) Single tabbed section with 5 tabs: Overview, Profit Distribution, Sensitivity Analysis, Optimization, Report. Remove standalone Executive Overview, Simulation Insights, Strategy Optimization, Decision support, Analyst recommendation, Business Story, and Business Insights sections; move their content into the appropriate tabs. Keep input assumptions in a compact area below the top bar. No changes to simulation, sensitivity, optimization, or report logic. |
| **src/components/ExecutiveSummary.tsx** | Convert to narrative-only: remove all metric cards (Financial outlook grid, Risk range grid). Keep: one short business outlook paragraph (generated from existing props), Key risk drivers list, Recommendation. Do not display Expected profit, P(loss), Break-even, percentiles, or Std dev again—those live only in the KPI strip. |
| **src/components/KPIStrip.tsx** | **New.** Single compact row showing: Expected Profit, Probability of Loss, Break-even Demand, 5th–95th percentile range, Standard Deviation. Props: result (mean, percentile5, percentile95, stdDev, probabilityOfLoss) + breakEven. Styling: consistent with dashboard (green/red for profit and risk). |
| **src/components/AnalysisTabs.tsx** | **New.** Tabbed panel with 5 tabs: Overview, Profit Distribution, Sensitivity Analysis, Optimization, Report. Content passed as ReactNode slots. Replaces use of SimulationInsightsTabs on the output page. |

**Not changed:** `MetricsSummary.tsx` (can remain in codebase but is no longer used on the output page), `SimulationInsightsTabs.tsx` (can remain for potential reuse elsewhere), `monteCarlo.ts`, `analytics.ts`, `optimization.ts`, `reportGenerator.ts`, or any other logic.

---

## Step 2: Architecture

### KPI strip
- **Single source of truth** for the main numbers. One horizontal row (wraps on small screens) with 5–6 items: Expected Profit, Probability of Loss, Break-even Demand, 5th–95th percentile range, Standard Deviation.
- Implemented as a presentational component `KPIStrip` taking `mean`, `stdDev`, `percentile5`, `percentile95`, `probabilityOfLoss`, `breakEvenDemand`. Uses same formatting as before (currency, units). Green for positive profit / lower risk, red for loss / high P(loss).

### Narrative Executive Summary
- **No repeated metrics.** ExecutiveSummary component becomes text-only: (1) A short **business outlook paragraph** (e.g. “Under current assumptions, expected profit is $X with a Y% probability of loss. Break-even requires Z units.”—but we must not duplicate the KPI strip; so the paragraph can reference the scenario and risk in words, and optionally cite one headline number like expected profit if we keep it to a single sentence). Actually to avoid any duplication, the narrative should say something like “This scenario shows [favorable/moderate/high-risk] outlook. Key risk drivers and recommendation are below.” and then list drivers and recommendation—no numbers in the paragraph, or one headline only (e.g. “Expected profit is positive/negative.”).
- (2) **Key risk drivers** (top sensitivity drivers). (3) **Concise recommendation** (first recommendation line). All existing props can stay; we just remove the grids that repeat the KPI values.

### Tabbed analysis layout
- **One tab bar** with 5 tabs: Overview | Profit Distribution | Sensitivity Analysis | Optimization | Report.
- **Overview:** Narrative ExecutiveSummary (outlook paragraph + risk drivers + recommendation) + Business insights bullets (recommendationLines as list).
- **Profit Distribution:** Existing ProfitHistogram.
- **Sensitivity Analysis:** Existing TornadoChart + Risk Heatmap (if present) below.
- **Optimization:** Existing optimization controls, best recommendation card, profit vs price chart, top 5 table, and Auto Decision card when optimization has been run.
- **Report:** Download Report button + short report summary text (e.g. “Download an HTML report with full results.”).
- Tabs implemented in `AnalysisTabs.tsx` with content slots; page supplies the content for each tab. State: `activeTab` in the scenario page.

---

## Step 4: Summary and testing

### Files changed

| File | Change |
|------|--------|
| **src/app/scenarios/[id]/page.tsx** | Top action bar (scenario name + Run simulation + Download report). Single KPI strip when result exists. One AnalysisTabs with 5 tabs (Overview, Profit distribution, Sensitivity analysis, Optimization, Report). Removed: Executive Overview block, Simulation Insights block, standalone Strategy Optimization, Decision support, Analyst recommendation, Business Story, Business Insights. Content moved into tabs. Removed imports: MetricsSummary, SimulationInsightsTabs, RecommendationBox. |
| **src/components/ExecutiveSummary.tsx** | Narrative-only: removed Financial outlook and Risk range metric grids. Kept: business outlook paragraph (favorable/moderate/high-risk), key risk drivers list, recommendation. No duplicate metrics. |
| **src/components/KPIStrip.tsx** | **New.** Single row of 5 KPIs: Expected profit, P(loss), Break-even demand, 5th–95th percentile, Std deviation. |
| **src/components/AnalysisTabs.tsx** | **New.** 5-tab panel: Overview, Profit distribution, Sensitivity analysis, Optimization, Report. |

### Repetition removed

- **Before:** Executive Summary showed Expected profit, P(loss), Break-even, 5th–95th, Std dev in card form; Summary metrics showed the same six metrics again in a grid. Recommendation and one-line recommendation also appeared in multiple places.
- **After:** Each metric appears once in the KPI strip. Executive Summary is narrative only (outlook, risk drivers, recommendation text). Business insights bullets and report download live in tabs (Overview and Report). No duplicate metric cards.

### How to test locally

1. Open a scenario (e.g. `/scenarios/[id]`). Confirm: top bar has scenario name, Run simulation, and (after run) Download report; input assumptions card below.
2. Click **Run simulation**. Confirm: **Key metrics** strip appears once with Expected profit, P(loss), Break-even demand, 5th–95th percentile, Std deviation. No second block repeating these numbers.
3. **Analysis** tabs: switch between Overview (narrative summary + business insights + business story), Profit distribution (histogram), Sensitivity analysis (tornado + heatmap), Optimization (controls, best recommendation, chart, top 5, Auto Decision), Report (download button + description). Confirm all content is present and Download report works.
4. Run optimization from the Optimization tab; confirm best recommendation and Auto Decision card appear. Confirm simulation, sensitivity, and report logic are unchanged.
