"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnalysisTabs, type AnalysisTabId } from "@/components/AnalysisTabs";
import { BusinessViabilityScore } from "@/components/BusinessViabilityScore";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { KPIStrip } from "@/components/KPIStrip";
import { OptimizationProfitChart } from "@/components/OptimizationProfitChart";
import { ProfitHistogram } from "@/components/ProfitHistogram";
import { AutoDecisionEngineCard } from "@/components/AutoDecisionEngineCard";
import { BusinessStorySection } from "@/components/BusinessStorySection";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { TornadoChart } from "@/components/TornadoChart";
import { buildReportHtml } from "@/lib/reportGenerator";
import {
  breakEvenDemand,
  buildRecommendationText,
  runSensitivityAnalysis,
  type SensitivityBar,
} from "@/lib/analytics";
import { computeViabilityScore } from "@/lib/viabilityScore";
import { db } from "@/lib/db";
import {
  runMonteCarlo,
  type ScenarioInputs,
  type SimulationResult,
} from "@/lib/monteCarlo";
import {
  MAX_OPTIMIZATION_CANDIDATES,
  runPriceGridSearch,
  type PriceOptimizationResult,
} from "@/lib/optimization";
import { buildAllStories, type StoryType } from "@/lib/businessStory";
import {
  computeRiskHeatmap,
  HEATMAP_DEFAULT_COLS,
  HEATMAP_DEFAULT_ROWS,
  type HeatmapMetric,
  type RiskHeatmapResult,
} from "@/lib/riskHeatmap";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function scenarioToInputs(s: {
  fixedCost: number;
  sellingPrice: number;
  demandDistributionType: string;
  demandMean?: number | null;
  demandStdDev?: number | null;
  demandMin?: number | null;
  demandMax?: number | null;
  demandMode?: number | null;
  variableCostDistributionType: string;
  variableCostMin?: number | null;
  variableCostMode?: number | null;
  variableCostMax?: number | null;
  numSimulations: number;
}): ScenarioInputs {
  return {
    numSimulations: s.numSimulations,
    fixedCost: s.fixedCost,
    sellingPrice: s.sellingPrice,
    demandDistributionType: s.demandDistributionType as ScenarioInputs["demandDistributionType"],
    demandMean: s.demandMean ?? null,
    demandStdDev: s.demandStdDev ?? null,
    demandMin: s.demandMin ?? null,
    demandMax: s.demandMax ?? null,
    demandMode: s.demandMode ?? null,
    variableCostDistributionType:
      s.variableCostDistributionType as ScenarioInputs["variableCostDistributionType"],
    variableCostMin: s.variableCostMin ?? null,
    variableCostMode: s.variableCostMode ?? null,
    variableCostMax: s.variableCostMax ?? null,
  };
}

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden";

export default function ScenarioDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const autoRunDoneRef = useRef(false);
  const { data, isLoading, error } = db.useQuery(
    id
      ? {
          scenarios: {
            $: { where: { id } },
            owner: {},
          },
        }
      : null
  );

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [sensitivityBars, setSensitivityBars] = useState<SensitivityBar[]>([]);
  const [sensitivityLoading, setSensitivityLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<PriceOptimizationResult | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optMinPrice, setOptMinPrice] = useState(0);
  const [optMaxPrice, setOptMaxPrice] = useState(100);
  const [optStep, setOptStep] = useState(1);
  const [heatmapResult, setHeatmapResult] = useState<RiskHeatmapResult | null>(
    null
  );
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>(
    "expectedProfit"
  );
  const [activeStory, setActiveStory] = useState<StoryType>("baseCase");
  const [activeAnalysisTab, setActiveAnalysisTab] =
    useState<AnalysisTabId>("overview");

  type ScenarioRecord = {
    id: string;
    fixedCost: number;
    sellingPrice: number;
    demandDistributionType: string;
    demandMean?: number | null;
    demandStdDev?: number | null;
    demandMin?: number | null;
    demandMax?: number | null;
    demandMode?: number | null;
    variableCostDistributionType: string;
    variableCostMin?: number | null;
    variableCostMode?: number | null;
    variableCostMax?: number | null;
    numSimulations: number;
    name: string;
    description?: string;
    updatedAt: Date;
    expectedProfit?: number;
    probabilityOfLoss?: number;
    percentile5?: number;
    percentile95?: number;
  };

  const scenario = useMemo((): ScenarioRecord | null => {
    const list = data?.scenarios ?? [];
    const first = list[0];
    return first ? (first as unknown as ScenarioRecord) : null;
  }, [data]);

  const inputs = useMemo(
    () => (scenario ? scenarioToInputs(scenario) : null),
    [scenario]
  );

  useEffect(() => {
    if (!inputs) return;
    const p = inputs.sellingPrice;
    setOptMinPrice(Math.max(0.01, Math.round(p * 0.8 * 100) / 100));
    setOptMaxPrice(Math.round(p * 1.2 * 100) / 100);
    setOptStep(Math.max(0.01, Math.round(p * 0.05 * 100) / 100));
  }, [inputs]);

  const autoRun = searchParams.get("autoRun") === "1";
  useEffect(() => {
    if (!autoRun || !scenario || !inputs || autoRunDoneRef.current) return;
    autoRunDoneRef.current = true;
    setRunning(true);
    setResult(null);
    setSensitivityBars([]);
    setTimeout(() => {
      try {
        const simResult = runMonteCarlo(inputs);
        setResult(simResult);
        db.transact(
          db.tx.scenarios[id].update({
            updatedAt: new Date(),
            expectedProfit: simResult.mean,
            probabilityOfLoss: simResult.probabilityOfLoss,
            percentile5: simResult.percentile5,
            percentile95: simResult.percentile95,
          })
        );
        setSensitivityLoading(true);
        setTimeout(() => {
          try {
            const bars = runSensitivityAnalysis(inputs);
            setSensitivityBars(bars);
          } finally {
            setSensitivityLoading(false);
          }
        }, 0);
      } finally {
        setRunning(false);
      }
    }, 0);
  }, [autoRun, scenario, inputs, id]);

  const breakEven = useMemo(
    () => (inputs ? breakEvenDemand(inputs) : null),
    [inputs]
  );

  const handleRunSimulation = () => {
    if (!scenario || !inputs) return;
    setRunning(true);
    setResult(null);
    setSensitivityBars([]);
    setTimeout(() => {
      try {
        const simResult = runMonteCarlo(inputs);
        setResult(simResult);
        db.transact(
          db.tx.scenarios[id].update({
            updatedAt: new Date(),
            expectedProfit: simResult.mean,
            probabilityOfLoss: simResult.probabilityOfLoss,
            percentile5: simResult.percentile5,
            percentile95: simResult.percentile95,
          })
        );
        setSensitivityLoading(true);
        setTimeout(() => {
          try {
            const bars = runSensitivityAnalysis(inputs);
            setSensitivityBars(bars);
          } finally {
            setSensitivityLoading(false);
          }
        }, 0);
      } finally {
        setRunning(false);
      }
    }, 0);
  };

  const recommendationLines = useMemo(() => {
    if (!result) return [];
    return buildRecommendationText({
      expectedProfit: result.mean,
      probabilityOfLoss: result.probabilityOfLoss,
      percentile5: result.percentile5,
      percentile95: result.percentile95,
      breakEvenDemand: breakEven ?? null,
      sensitivityBars,
    });
  }, [result, breakEven, sensitivityBars]);

  const viabilityResult = useMemo(() => {
    if (!result) return null;
    return computeViabilityScore({
      expectedProfit: result.mean,
      probabilityOfLoss: result.probabilityOfLoss,
      breakEvenDemand: breakEven ?? null,
      stdDev: result.stdDev,
    });
  }, [result, breakEven]);

  const handleDownloadReport = useCallback(() => {
    if (!scenario || !result) return;
    const html = buildReportHtml(
      {
        name: scenario.name,
        description: scenario.description,
        fixedCost: scenario.fixedCost,
        sellingPrice: scenario.sellingPrice,
        demandDistributionType: scenario.demandDistributionType,
        demandMean: scenario.demandMean,
        demandStdDev: scenario.demandStdDev,
        demandMin: scenario.demandMin,
        demandMax: scenario.demandMax,
        demandMode: scenario.demandMode,
        variableCostDistributionType: scenario.variableCostDistributionType,
        variableCostMin: scenario.variableCostMin,
        variableCostMode: scenario.variableCostMode,
        variableCostMax: scenario.variableCostMax,
        numSimulations: scenario.numSimulations,
      },
      {
        mean: result.mean,
        stdDev: result.stdDev,
        percentile5: result.percentile5,
        percentile95: result.percentile95,
        probabilityOfLoss: result.probabilityOfLoss,
      },
      breakEven ?? null,
      sensitivityBars,
      recommendationLines,
      {
        profits: result.profits,
        optimization: optimizationResult
          ? {
              best: {
                price: optimizationResult.best.price,
                expectedProfit: optimizationResult.best.expectedProfit,
                probabilityOfLoss: optimizationResult.best.probabilityOfLoss,
                probabilityOfProfit: optimizationResult.best.probabilityOfProfit,
              },
              topFive: optimizationResult.topFive.map((r) => ({
                price: r.price,
                expectedProfit: r.expectedProfit,
                probabilityOfLoss: r.probabilityOfLoss,
                probabilityOfProfit: r.probabilityOfProfit,
              })),
              allCandidates: optimizationResult.allCandidates.map((c) => ({
                price: c.price,
                expectedProfit: c.expectedProfit,
              })),
            }
          : undefined,
      }
    );
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RiskLens-Report-${scenario.name.replace(/[^a-zA-Z0-9-_]/g, "-")}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scenario, result, breakEven, sensitivityBars, recommendationLines, optimizationResult]);

  const handleRunOptimization = useCallback(() => {
    if (!inputs) return;
    setOptimizationError(null);
    if (optMinPrice >= optMaxPrice) {
      setOptimizationError("Min price must be less than max price.");
      return;
    }
    if (optStep <= 0) {
      setOptimizationError("Step must be greater than 0.");
      return;
    }
    const estimatedSteps =
      Math.floor((optMaxPrice - optMinPrice) / optStep) + 1;
    if (estimatedSteps > MAX_OPTIMIZATION_CANDIDATES) {
      setOptimizationError(
        `Too many steps (max ${MAX_OPTIMIZATION_CANDIDATES}). Increase step size or narrow the range to keep the page responsive.`
      );
      return;
    }
    setOptimizationLoading(true);
    setOptimizationResult(null);
    setTimeout(() => {
      try {
        const res = runPriceGridSearch(
          inputs,
          optMinPrice,
          optMaxPrice,
          optStep
        );
        setOptimizationResult(res);
      } catch (e) {
        setOptimizationError(
          "Optimization failed. Check that min, max, and step are valid numbers."
        );
        setOptimizationResult(null);
      } finally {
        setOptimizationLoading(false);
      }
    }, 0);
  }, [inputs, optMinPrice, optMaxPrice, optStep]);

  const formatOptCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const canShowHeatmap =
    inputs?.demandDistributionType === "normal" &&
    inputs.demandMean != null &&
    inputs.demandStdDev != null;

  const businessStories = useMemo(() => {
    if (!result) return null;
    return buildAllStories({
      expectedProfit: result.mean,
      probabilityOfLoss: result.probabilityOfLoss,
      percentile5: result.percentile5,
      percentile95: result.percentile95,
      breakEvenDemand: breakEven ?? null,
      topSensitivityDrivers: sensitivityBars.slice(0, 2).map((b) => b.name),
      recommendationLines,
      optimizedPrice: optimizationResult?.best.price ?? null,
      optimizedExpectedProfit: optimizationResult?.best.expectedProfit ?? null,
      optimizedProbabilityOfLoss:
        optimizationResult?.best.probabilityOfLoss ?? null,
    });
  }, [
    result,
    breakEven,
    sensitivityBars,
    recommendationLines,
    optimizationResult?.best,
  ]);

  const handleRunHeatmap = useCallback(() => {
    if (!inputs || !canShowHeatmap) return;
    setHeatmapLoading(true);
    setHeatmapResult(null);
    setTimeout(() => {
      try {
        const price = inputs.sellingPrice;
        const mean = inputs.demandMean ?? 0;
        const res = computeRiskHeatmap(inputs, {
          priceMin: Math.max(0.01, price * 0.7),
          priceMax: price * 1.3,
          demandMeanMin: Math.max(0, mean * 0.7),
          demandMeanMax: mean * 1.3,
          rows: HEATMAP_DEFAULT_ROWS,
          cols: HEATMAP_DEFAULT_COLS,
          metric: heatmapMetric,
        });
        setHeatmapResult(res);
      } catch {
        setHeatmapResult(null);
      } finally {
        setHeatmapLoading(false);
      }
    }, 0);
  }, [inputs, canShowHeatmap, heatmapMetric]);

  return (
    <AuthGuard>
      <DashboardLayout title="Scenario">
        {isLoading && (
          <div className="text-slate-500 py-8">Loading scenario...</div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}
        {!scenario && !isLoading && !error && (
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-6 text-slate-700">
            Scenario not found.
          </div>
        )}
        {scenario && (
          <div className="space-y-10">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-500 hover:text-slate-800 font-medium"
              >
                ← Dashboard
              </Link>
              <Link
                href={`/scenarios/${id}/abm`}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ABM mode
              </Link>
            </div>

            {/* Top action: scenario context + Run simulation + Download report (when result) */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-900 truncate">
                  {scenario.name}
                </h2>
                {scenario.description && (
                  <p className="mt-0.5 text-slate-600 text-sm line-clamp-2">
                    {scenario.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={running}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {running ? "Running…" : "Run simulation"}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition whitespace-nowrap"
                  >
                    Download report
                  </button>
                )}
              </div>
            </section>

            {/* Input assumptions (compact) */}
            <section className={`${cardClass} p-5`}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
                Input assumptions
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Fixed cost</dt>
                    <dd className="font-medium text-slate-900">
                      ${Number(scenario.fixedCost).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Selling price</dt>
                    <dd className="font-medium text-slate-900">
                      ${Number(scenario.sellingPrice).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Demand distribution</dt>
                    <dd className="font-medium text-slate-900 capitalize text-sm">
                      {scenario.demandDistributionType}
                      {scenario.demandDistributionType === "normal" &&
                        ` (μ=${scenario.demandMean}, σ=${scenario.demandStdDev})`}
                      {(scenario.demandDistributionType === "triangular" ||
                        scenario.demandDistributionType === "uniform") &&
                        ` (min=${scenario.demandMin}, max=${scenario.demandMax})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Variable cost</dt>
                    <dd className="font-medium text-slate-900 capitalize text-sm">
                      {scenario.variableCostDistributionType}
                      {scenario.variableCostDistributionType === "fixed" &&
                        ` (${scenario.variableCostMode ?? scenario.variableCostMin ?? scenario.variableCostMax} per unit)`}
                      {(scenario.variableCostDistributionType === "triangular" ||
                        scenario.variableCostDistributionType === "uniform") &&
                        ` (min=${scenario.variableCostMin}, max=${scenario.variableCostMax})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Simulations</dt>
                    <dd className="font-medium text-slate-900">
                      {Number(scenario.numSimulations).toLocaleString()}
                    </dd>
                  </div>
                  {breakEven != null && (
                    <div>
                      <dt className="text-xs text-slate-500">Break-even demand</dt>
                      <dd className="font-medium text-slate-900">
                        {breakEven.toLocaleString()} units
                      </dd>
                    </div>
                  )}
                </dl>
            </section>

            {result && (
              <>
                {/* Business Viability Score */}
                {viabilityResult && (
                  <BusinessViabilityScore
                    score={viabilityResult.score}
                    label={viabilityResult.label}
                    interpretation={viabilityResult.interpretation}
                  />
                )}

                {/* KPI strip: single place for key metrics */}
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Key metrics
                  </h2>
                  <KPIStrip
                    mean={result.mean}
                    stdDev={result.stdDev}
                    percentile5={result.percentile5}
                    percentile95={result.percentile95}
                    probabilityOfLoss={result.probabilityOfLoss}
                    breakEvenDemand={breakEven ?? null}
                  />
                </section>

                {/* Tabbed analysis: Overview | Profit | Sensitivity | Optimization | Report */}
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Analysis
                  </h2>
                  <AnalysisTabs
                    activeTab={activeAnalysisTab}
                    onTabChange={setActiveAnalysisTab}
                    overviewContent={
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-3">
                            Executive summary
                          </h3>
                          <ExecutiveSummary
                            scenarioName={scenario.name}
                            expectedProfit={result.mean}
                            probabilityOfLoss={result.probabilityOfLoss}
                            breakEvenDemand={breakEven ?? null}
                            percentile5={result.percentile5}
                            percentile95={result.percentile95}
                            stdDev={result.stdDev}
                            topSensitivityDrivers={sensitivityBars.slice(0, 2).map((b) => b.name)}
                            firstRecommendationLine={
                              recommendationLines.length > 0 ? recommendationLines[0] : null
                            }
                          />
                        </div>
                        {recommendationLines.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">
                              Business insights
                            </h3>
                            <ul className="space-y-2 list-disc list-inside text-sm text-slate-700">
                              {recommendationLines.map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {businessStories && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">
                              Business story
                            </h3>
                            <BusinessStorySection
                              baseCaseStory={businessStories.baseCase}
                              riskStory={businessStories.risk}
                              recommendationStory={businessStories.recommendation}
                              activeStory={activeStory}
                              onSelectStory={setActiveStory}
                            />
                          </div>
                        )}
                      </div>
                    }
                    profitContent={<ProfitHistogram profits={result.profits} />}
                    sensitivityContent={
                      <div className="space-y-6">
                        {sensitivityLoading ? (
                          <p className="text-sm text-slate-500 py-4">
                            Computing sensitivity…
                          </p>
                        ) : (
                          <TornadoChart bars={sensitivityBars} className="mt-0" />
                        )}
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Risk heatmap
                          </h4>
                          <p className="text-sm text-slate-500 mb-4">
                            See how expected profit or probability of loss
                            changes across price and demand levels.
                          </p>
                          {!canShowHeatmap ? (
                            <p className="text-sm text-slate-500 py-2">
                              Available for scenarios with Normal demand (mean
                              and standard deviation).
                            </p>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-4 mb-4">
                                <label className="flex items-center gap-2">
                                  <span className="text-sm text-slate-600">
                                    Color by:
                                  </span>
                                  <select
                                    value={heatmapMetric}
                                    onChange={(e) =>
                                      setHeatmapMetric(e.target.value as HeatmapMetric)
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                  >
                                    <option value="expectedProfit">
                                      Expected profit
                                    </option>
                                    <option value="probabilityOfLoss">
                                      Probability of loss
                                    </option>
                                  </select>
                                </label>
                                <button
                                  type="button"
                                  onClick={handleRunHeatmap}
                                  disabled={heatmapLoading}
                                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                                >
                                  {heatmapLoading
                                    ? "Building heatmap…"
                                    : "Run risk heatmap"}
                                </button>
                              </div>
                              {heatmapResult && (
                                <div className="space-y-3">
                                  <RiskHeatmap data={heatmapResult} />
                                  <p className="text-slate-600 text-sm">
                                    {heatmapResult.metric === "expectedProfit"
                                      ? "Greener = higher expected profit; redder = riskier."
                                      : "Greener = lower probability of loss."}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    }

                    optimizationContent={
                      <div className="space-y-6">
                        <p className="text-sm text-slate-500">
                          Find the selling price that maximizes expected profit.
                          Set min, max, and step, then run.
                        </p>
                        {optimizationError && (
                          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {optimizationError}
                          </div>
                        )}
                        <div className="flex flex-wrap items-end gap-4">
                          <label className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                              Min price
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={optMinPrice}
                              onChange={(e) => {
                                setOptimizationError(null);
                                setOptMinPrice(Number(e.target.value) || 0);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-2 w-28 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                              Max price
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={optMaxPrice}
                              onChange={(e) => {
                                setOptimizationError(null);
                                setOptMaxPrice(Number(e.target.value) || 0);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-2 w-28 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                              Step
                            </span>
                            <input
                              type="number"
                              min={0.01}
                              step={0.01}
                              value={optStep}
                              onChange={(e) => {
                                setOptimizationError(null);
                                setOptStep(Number(e.target.value) || 0.01);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-2 w-24 text-sm"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRunOptimization}
                            disabled={optimizationLoading}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                          >
                            {optimizationLoading
                              ? "Running…"
                              : "Run optimization"}
                          </button>
                        </div>
                        {optimizationLoading && (
                          <p className="text-sm text-slate-500">
                            Running optimization… Please wait.
                          </p>
                        )}
                        {optimizationResult && (
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 mb-3">
                                Best recommendation
                              </p>
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                    Recommended price
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {formatOptCurrency(optimizationResult.best.price)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                    Expected profit
                                  </p>
                                  <p
                                    className={`mt-1 text-lg font-semibold ${
                                      optimizationResult.best.expectedProfit >= 0
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {formatOptCurrency(
                                      optimizationResult.best.expectedProfit
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                    P(loss)
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {optimizationResult.best.probabilityOfLoss.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                    P(profit)
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {optimizationResult.best.probabilityOfProfit.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Profit vs price
                              </p>
                              <OptimizationProfitChart
                                candidates={optimizationResult.allCandidates}
                                bestPrice={optimizationResult.best.price}
                                className="mb-4"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Top 5 price options
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                                  <thead>
                                    <tr className="bg-slate-50">
                                      <th className="text-left py-2 px-3 font-medium text-slate-600">
                                        Price
                                      </th>
                                      <th className="text-left py-2 px-3 font-medium text-slate-600">
                                        Expected profit
                                      </th>
                                      <th className="text-left py-2 px-3 font-medium text-slate-600">
                                        P(loss)
                                      </th>
                                      <th className="text-left py-2 px-3 font-medium text-slate-600">
                                        P(profit)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {optimizationResult.topFive.map((row, i) => (
                                      <tr
                                        key={i}
                                        className={`border-t border-slate-100 ${
                                          i === 0
                                            ? "bg-indigo-50/70 font-medium"
                                            : "even:bg-slate-50/50"
                                        }`}
                                      >
                                        <td className="py-2 px-3">
                                          {formatOptCurrency(row.price)}
                                        </td>
                                        <td className="py-2 px-3 tabular-nums">
                                          {formatOptCurrency(row.expectedProfit)}
                                        </td>
                                        <td className="py-2 px-3 tabular-nums">
                                          {row.probabilityOfLoss.toFixed(1)}%
                                        </td>
                                        <td className="py-2 px-3 tabular-nums">
                                          {row.probabilityOfProfit.toFixed(1)}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              Best selling price in range:{" "}
                              <strong>
                                {formatOptCurrency(optimizationResult.best.price)}
                              </strong>
                              , expected profit{" "}
                              <strong>
                                {formatOptCurrency(
                                  optimizationResult.best.expectedProfit
                                )}
                              </strong>
                              , P(loss){" "}
                              <strong>
                                {optimizationResult.best.probabilityOfLoss.toFixed(1)}%
                              </strong>
                              .
                            </p>
                            <AutoDecisionEngineCard
                              currentPrice={scenario.sellingPrice}
                              baselineExpectedProfit={result.mean}
                              baselineProbabilityOfLoss={result.probabilityOfLoss}
                              recommendedPrice={optimizationResult.best.price}
                              optimizedExpectedProfit={
                                optimizationResult.best.expectedProfit
                              }
                              optimizedProbabilityOfLoss={
                                optimizationResult.best.probabilityOfLoss
                              }
                              whyLine={
                                recommendationLines.length > 0
                                  ? recommendationLines[0]
                                  : null
                              }
                            />
                          </div>
                        )}
                      </div>
                    }
                    reportContent={
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Download an HTML report with full results, assumptions,
                          metrics, sensitivity, and recommendations.
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadReport}
                          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                        >
                          Download report
                        </button>
                      </div>
                    }
                  />
                </section>
              </>
            )}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
