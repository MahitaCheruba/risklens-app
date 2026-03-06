"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InterpretationBox } from "@/components/InterpretationBox";
import { MetricsSummary } from "@/components/MetricsSummary";
import { ProfitHistogram } from "@/components/ProfitHistogram";
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

  const handleRunSimulation = () => {
    if (!scenario) return;
    setRunning(true);
    setResult(null);
    const inputs = scenarioToInputs(scenario);
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
      } finally {
        setRunning(false);
      }
    }, 0);
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Scenario">
        {isLoading && (
          <div className="text-slate-500">Loading scenario...</div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}
        {!scenario && !isLoading && !error && (
          <div className="rounded-lg bg-slate-100 p-4 text-slate-700">
            Scenario not found.
          </div>
        )}
        {scenario && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Dashboard
              </Link>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {scenario.name}
              </h2>
              {scenario.description && (
                <p className="mt-1 text-slate-600">{scenario.description}</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Input assumptions
              </h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Fixed cost</dt>
                  <dd className="font-medium">
                    ${Number(scenario.fixedCost).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Selling price</dt>
                  <dd className="font-medium">
                    ${Number(scenario.sellingPrice).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Demand distribution</dt>
                  <dd className="font-medium capitalize">
                    {scenario.demandDistributionType}
                    {scenario.demandDistributionType === "normal" &&
                      ` (μ=${scenario.demandMean}, σ=${scenario.demandStdDev})`}
                    {(scenario.demandDistributionType === "triangular" ||
                      scenario.demandDistributionType === "uniform") &&
                      ` (min=${scenario.demandMin}, max=${scenario.demandMax})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Variable cost distribution</dt>
                  <dd className="font-medium capitalize">
                    {scenario.variableCostDistributionType}
                    {scenario.variableCostDistributionType === "fixed" &&
                      ` (${scenario.variableCostMode ?? scenario.variableCostMin ?? scenario.variableCostMax} per unit)`}
                    {(scenario.variableCostDistributionType === "triangular" ||
                      scenario.variableCostDistributionType === "uniform") &&
                      ` (min=${scenario.variableCostMin}, max=${scenario.variableCostMax})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Number of simulations</dt>
                  <dd className="font-medium">
                    {Number(scenario.numSimulations).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={running}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {running ? "Running simulation…" : "Run Simulation"}
              </button>
            </section>

            {result && (
              <>
                <MetricsSummary
                  mean={result.mean}
                  stdDev={result.stdDev}
                  percentile5={result.percentile5}
                  percentile95={result.percentile95}
                  probabilityOfLoss={result.probabilityOfLoss}
                />
                <ProfitHistogram profits={result.profits} />
                <InterpretationBox
                  mean={result.mean}
                  probabilityOfLoss={result.probabilityOfLoss}
                  percentile5={result.percentile5}
                  percentile95={result.percentile95}
                />
              </>
            )}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
