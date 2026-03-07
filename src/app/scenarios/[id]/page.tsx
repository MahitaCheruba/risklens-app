"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricsSummary } from "@/components/MetricsSummary";
import { ProfitHistogram } from "@/components/ProfitHistogram";
import { RecommendationBox } from "@/components/RecommendationBox";
import { TornadoChart } from "@/components/TornadoChart";
import {
  breakEvenDemand,
  buildRecommendationText,
  runSensitivityAnalysis,
  type SensitivityBar,
} from "@/lib/analytics";
import { db } from "@/lib/db";
import {
  runMonteCarlo,
  type ScenarioInputs,
  type SimulationResult,
} from "@/lib/monteCarlo";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

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
  const id = params?.id as string;
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
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-500 hover:text-slate-800 font-medium"
              >
                ← Dashboard
              </Link>
            </div>

            {/* Scenario header */}
            <section className={`${cardClass} p-5`}>
              <h2 className="text-xl font-semibold text-slate-900">
                {scenario.name}
              </h2>
              {scenario.description && (
                <p className="mt-1 text-slate-600 text-sm">
                  {scenario.description}
                </p>
              )}
            </section>

            {/* Input assumptions */}
            <section className={`${cardClass} p-5`}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
                Input assumptions
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <dd className="font-medium text-slate-900 capitalize">
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
                  <dd className="font-medium text-slate-900 capitalize">
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

            {/* Run simulation */}
            <section>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={running}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {running ? "Running simulation…" : "Run simulation"}
              </button>
            </section>

            {result && (
              <>
                {/* Summary metrics */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
                    Summary metrics
                  </h3>
                  <MetricsSummary
                    mean={result.mean}
                    stdDev={result.stdDev}
                    percentile5={result.percentile5}
                    percentile95={result.percentile95}
                    probabilityOfLoss={result.probabilityOfLoss}
                    breakEvenDemand={breakEven ?? null}
                  />
                </section>

                {/* Profit distribution */}
                <section className={`${cardClass} p-5`}>
                  <ProfitHistogram profits={result.profits} />
                </section>

                {/* Sensitivity analysis */}
                <section className={`${cardClass} p-5`}>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    Sensitivity analysis
                  </h3>
                  {sensitivityLoading ? (
                    <p className="text-sm text-slate-500 py-4">
                      Computing sensitivity…
                    </p>
                  ) : (
                    <TornadoChart bars={sensitivityBars} className="mt-2" />
                  )}
                </section>

                {/* Recommendation */}
                <section>
                  <RecommendationBox lines={recommendationLines} />
                </section>
              </>
            )}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
