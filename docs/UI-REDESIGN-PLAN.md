# RiskLens UI Redesign – Step 1 & 2

## Step 1: Files to change

| File | Role |
|------|------|
| **src/app/scenarios/new/page.tsx** | Input page. Reorganize into: page header (title + subtitle), Scenario Details card, Financial Assumptions card, Demand Model card, Simulation Settings card, sticky/footer action bar. Centered max-width container. No state or submit logic changes. |
| **src/app/scenarios/[id]/page.tsx** | Results page. Reorganize into: (A) Top summary strip = Input Assumptions + Run simulation, (B) Executive Overview = Executive Summary + key metrics + Download Report + concise recommendation, (C) Simulation Insights = tabbed card (Profit Distribution | Sensitivity Analysis | Risk Heatmap), (D) Strategy Optimization = existing optimization block, (E) Business Insights = bullet interpretation. Add tab state; consistent section spacing and headings. No simulation/optimization/sensitivity/recommendation logic changes. |
| **src/components/SimulationInsightsTabs.tsx** (new) | Presentational tabbed panel: three tabs (Profit Distribution, Sensitivity Analysis, Risk Heatmap), one content area. Keeps results page maintainable. |

No changes to: `monteCarlo.ts`, `analytics.ts`, `optimization.ts`, `riskHeatmap.ts`, `reportGenerator.ts`, `businessStory.ts`, or to the internal logic of ExecutiveSummary, MetricsSummary, ProfitHistogram, TornadoChart, RecommendationBox, etc. Only layout, order, and styling in the two pages and one new wrapper component.

---

## Step 2: UI architecture

- **Input page:** Single form in `new/page.tsx`. DashboardLayout already provides `max-w-5xl` and an h1; we use a centered `max-w-2xl` for the form content. Cards use a shared style: `rounded-2xl border border-slate-200 bg-white shadow-sm p-6`. Section spacing: `space-y-8`. Action bar: `border-t border-slate-200 pt-6 mt-8 flex gap-3`. All existing state and `handleSubmit` stay; only JSX structure and class names change.
- **Results page:** Keep all data and handlers in `[id]/page.tsx`. Reuse every existing component (ExecutiveSummary, MetricsSummary, ProfitHistogram, TornadoChart, RiskHeatmap, RecommendationBox, OptimizationProfitChart, AutoDecisionEngineCard, BusinessStorySection) with the same props. New wrapper: **SimulationInsightsTabs** with `activeTab`, `onTabChange`, and three content slots so only one of Profit / Sensitivity / Heatmap is visible at a time. Section order: Top strip → Executive Overview (summary + metrics + download + one-line recommendation) → Simulation Insights (tabs) → Strategy Optimization (unchanged block) → Auto Decision (if present) → Recommendation box → Business Story → Business Insights (optional bullet list from recommendationLines). Consistent section wrapper: `section` with `className="space-y-6"` and a section heading with optional supporting text. Spacing between major sections: `space-y-10` or `space-y-12`.
- **Design tokens:** Use existing Tailwind palette (slate, indigo, emerald, rose). Primary actions: `bg-indigo-600`. Favorable: `text-emerald-600`. Risk/negative: `text-rose-600`. Cards: `rounded-2xl border border-slate-200 bg-white shadow-sm`. Section titles: `text-sm font-semibold uppercase tracking-wider text-slate-600` or similar. No new CSS files; all in Tailwind classes.

---

## Step 4: Summary and testing

### Files changed

| File | Changes |
|------|--------|
| **src/app/scenarios/new/page.tsx** | Page header with subtitle; Scenario Details, Financial Assumptions, Demand Model, Simulation Settings cards; centered `max-w-2xl`; action bar with border-t; same state and `handleSubmit`. |
| **src/app/scenarios/[id]/page.tsx** | Top strip (Input Assumptions + Run simulation); Executive Overview (Executive Summary + MetricsSummary grid + Download + one-line recommendation); Simulation Insights tabbed (Profit / Sensitivity / Heatmap); Strategy Optimization and Decision support headers; Analyst recommendation; Business Story with header; Business Insights bullet list. Added `activeInsightTab` state and `SimulationInsightsTabs`. |
| **src/components/SimulationInsightsTabs.tsx** | New: tabbed panel with Profit distribution, Sensitivity analysis, Risk heatmap. |
| **docs/UI-REDESIGN-PLAN.md** | Plan and Step 4 summary. |

### UI improvements

- **Input page:** Clear card grouping, section titles, helper text for simulations, consistent spacing (`space-y-8`), separated action bar. Title set to "New Scenario" with supporting subtitle.
- **Results page:** Less vertical crowding; Executive Overview combines summary + metrics + download + recommendation; one tab visible at a time for Profit/Sensitivity/Heatmap; section headers with optional supporting text; Business Insights as scannable bullets; consistent `space-y-10` between major sections.

### How to test locally

1. **Input page:** Open `/scenarios/new`. Check: title "New Scenario", subtitle, five cards (Scenario details, Financial assumptions, Demand model, Simulation settings), action bar at bottom. Create a scenario (all distribution types, variable cost types) and confirm it still saves and redirects to the scenario detail page.
2. **Results page:** Open a scenario (e.g. `/scenarios/[id]`). Run simulation. Check: Top strip (assumptions + Run simulation); Executive Overview (summary, metrics, Download Report, recommendation line); Simulation Insights tabs (switch between Profit distribution, Sensitivity analysis, Risk heatmap); Strategy optimization (run optimization, see best recommendation, chart, top 5 table); Decision support (if optimization run); Analyst recommendation; Business story; Business Insights bullets. Confirm Download Report, optimization, heatmap, and all existing behavior still work.
