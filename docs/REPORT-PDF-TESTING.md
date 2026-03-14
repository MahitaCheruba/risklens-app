# RiskLens Report — Testing the PDF

The report is generated as **HTML**. To get a **PDF**, use your browser’s print feature and choose **Save as PDF**.

## What was changed

- **src/lib/reportGenerator.ts** — Report layout is now a structured 5-section document. No changes to Monte Carlo, optimization, or analytics logic.
- **src/app/scenarios/[id]/page.tsx** — Download report now passes `profits` and `optimizationResult` (when available) into the report generator.

## Report structure

1. **Page 1 — Executive Summary**  
   Scenario overview (inputs), key metrics (expected profit, P(loss), P(profit), break-even, risk range), executive insight paragraph, recommendation.

2. **Page 2 — Profit Risk Distribution**  
   Histogram of simulated profits (inline SVG) and a short interpretation.

3. **Page 3 — Sensitivity Analysis**  
   Sensitivity (tornado) chart (inline SVG), impact table, and which inputs most affect profitability.

4. **Page 4 — Optimization Results**  
   Recommended price, expected profit at optimal price, P(loss), profit vs price chart, top 5 price options table. If optimization was not run, this section shows a short message instead.

5. **Page 5 — Strategic Insights**  
   Bullet-point insights from the recommendation engine.

## How to test the report (and save as PDF) locally

1. **Run the app**
   ```bash
   npm run dev
   ```
2. Open a scenario (e.g. `http://localhost:3000/scenarios/[id]`).
3. Click **Run simulation** and wait for results.
4. (Optional) Open the **Optimization** tab and click **Run optimization** so Page 4 includes optimization results.
5. Click **Download report** (top bar or Report tab). The browser will download an `.html` file.
6. Open the downloaded HTML file in your browser (double-click or drag into Chrome/Edge/Firefox).
7. **Save as PDF**
   - **Chrome / Edge:** `Ctrl+P` (or Cmd+P on Mac) → Destination: **Save as PDF** → Save.
   - **Firefox:** `Ctrl+P` → **Save to PDF** (or Print to PDF).
8. Check the PDF:
   - **Page 1:** Title, scenario name, date, scenario overview table, key metrics grid, executive insight, recommendation.
   - **Page 2:** Histogram and interpretation text.
   - **Page 3:** Sensitivity chart and table, top drivers text.
   - **Page 4:** Optimization KPIs, profit vs price chart, top 5 table (or “Optimization was not run” if you skipped step 4).
   - **Page 5:** Strategic insights bullets.

## Design notes

- Key metrics appear **once** on Page 1; later pages do not repeat them.
- Print CSS uses `page-break-after: always` on each section so each section starts on a new page when printing.
- Charts are inline SVG so the report is self-contained and prints correctly.
