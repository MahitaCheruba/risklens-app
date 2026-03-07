"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { breakEvenDemand } from "@/lib/analytics";
import type { ScenarioInputs } from "@/lib/monteCarlo";
import { db } from "@/lib/db";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function scenarioToInputs(s: CompareScenarioRecord): ScenarioInputs {
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

type CompareScenarioRecord = {
  id: string;
  name: string;
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
  expectedProfit?: number;
  probabilityOfLoss?: number;
  percentile5?: number;
  percentile95?: number;
};

export default function CompareScenariosPage() {
  const { user } = db.useAuth();
  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          scenarios: {
            $: {
              where: { "owner.id": user.id },
              order: { serverCreatedAt: "desc" },
            },
          },
        }
      : null
  );

  const scenarios = useMemo(
    () => (data?.scenarios ?? []) as CompareScenarioRecord[],
    [data]
  );
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const scenarioA = useMemo(
    () => scenarios.find((s) => s.id === idA) ?? null,
    [scenarios, idA]
  );
  const scenarioB = useMemo(
    () => scenarios.find((s) => s.id === idB) ?? null,
    [scenarios, idB]
  );

  const breakEvenA = useMemo(
    () => (scenarioA ? breakEvenDemand(scenarioToInputs(scenarioA)) : null),
    [scenarioA]
  );
  const breakEvenB = useMemo(
    () => (scenarioB ? breakEvenDemand(scenarioToInputs(scenarioB)) : null),
    [scenarioB]
  );

  const comparisonRows = useMemo(() => {
    const rows: { label: string; valA: number | string; valB: number | string }[] = [];
    if (!scenarioA || !scenarioB) return rows;
    if (scenarioA.expectedProfit != null && scenarioB.expectedProfit != null) {
      rows.push({
        label: "Expected profit",
        valA: scenarioA.expectedProfit,
        valB: scenarioB.expectedProfit,
      });
    }
    if (scenarioA.probabilityOfLoss != null && scenarioB.probabilityOfLoss != null) {
      rows.push({
        label: "Probability of loss (%)",
        valA: scenarioA.probabilityOfLoss,
        valB: scenarioB.probabilityOfLoss,
      });
    }
    if (breakEvenA != null && breakEvenB != null) {
      rows.push({
        label: "Break-even demand",
        valA: breakEvenA,
        valB: breakEvenB,
      });
    }
    if (
      scenarioA.percentile5 != null &&
      scenarioA.percentile95 != null &&
      scenarioB.percentile5 != null &&
      scenarioB.percentile95 != null
    ) {
      rows.push({
        label: "5th percentile",
        valA: scenarioA.percentile5,
        valB: scenarioB.percentile5,
      });
      rows.push({
        label: "95th percentile",
        valA: scenarioA.percentile95,
        valB: scenarioB.percentile95,
      });
    }
    return rows;
  }, [scenarioA, scenarioB, breakEvenA, breakEvenB]);

  const formatVal = (v: number | string, label: string): string => {
    if (typeof v === "string") return v;
    if (label.includes("%") || label.includes("Probability")) return `${v.toFixed(1)}%`;
    if (label.includes("demand") || label.includes("percentile")) return v.toLocaleString();
    return formatCurrency(v);
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Compare scenarios">
        <div className="space-y-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Dashboard
          </Link>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {isLoading && (
            <div className="text-slate-500 py-4">Loading scenarios…</div>
          )}

          {!isLoading && scenarios.length < 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              You need at least two scenarios to compare.{" "}
              <Link
                href="/scenarios/new"
                className="text-indigo-600 font-medium hover:underline"
              >
                Create another scenario
              </Link>
            </div>
          )}

          {!isLoading && scenarios.length >= 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    Scenario A
                  </label>
                  <select
                    value={idA}
                    onChange={(e) => setIdA(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select…</option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    Scenario B
                  </label>
                  <select
                    value={idB}
                    onChange={(e) => setIdB(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select…</option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(scenarioA || scenarioB) && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="grid gap-0 sm:grid-cols-2">
                    <div className="p-5 border-b sm:border-b-0 sm:border-r border-slate-200">
                      <h3 className="font-semibold text-slate-900 mb-4">
                        {scenarioA ? scenarioA.name : "—"}
                      </h3>
                      {scenarioA ? (
                        <dl className="space-y-3 text-sm">
                          <div>
                            <dt className="text-slate-500">Expected profit</dt>
                            <dd className="font-semibold text-slate-900">
                              {scenarioA.expectedProfit != null
                                ? formatCurrency(scenarioA.expectedProfit)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Probability of loss</dt>
                            <dd className="font-semibold">
                              {scenarioA.probabilityOfLoss != null
                                ? `${scenarioA.probabilityOfLoss.toFixed(1)}%`
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Break-even demand</dt>
                            <dd className="font-semibold">
                              {breakEvenA != null
                                ? breakEvenA.toLocaleString() + " units"
                                : "Not achievable"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">5th – 95th percentile</dt>
                            <dd className="font-semibold">
                              {scenarioA.percentile5 != null &&
                              scenarioA.percentile95 != null
                                ? `${formatCurrency(scenarioA.percentile5)} – ${formatCurrency(scenarioA.percentile95)}`
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="text-slate-500">Select a scenario</p>
                      )}
                      {scenarioA && (
                        <Link
                          href={`/scenarios/${scenarioA.id}`}
                          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View & run simulation →
                        </Link>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-4">
                        {scenarioB ? scenarioB.name : "—"}
                      </h3>
                      {scenarioB ? (
                        <dl className="space-y-3 text-sm">
                          <div>
                            <dt className="text-slate-500">Expected profit</dt>
                            <dd className="font-semibold text-slate-900">
                              {scenarioB.expectedProfit != null
                                ? formatCurrency(scenarioB.expectedProfit)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Probability of loss</dt>
                            <dd className="font-semibold">
                              {scenarioB.probabilityOfLoss != null
                                ? `${scenarioB.probabilityOfLoss.toFixed(1)}%`
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Break-even demand</dt>
                            <dd className="font-semibold">
                              {breakEvenB != null
                                ? breakEvenB.toLocaleString() + " units"
                                : "Not achievable"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">5th – 95th percentile</dt>
                            <dd className="font-semibold">
                              {scenarioB.percentile5 != null &&
                              scenarioB.percentile95 != null
                                ? `${formatCurrency(scenarioB.percentile5)} – ${formatCurrency(scenarioB.percentile95)}`
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="text-slate-500">Select a scenario</p>
                      )}
                      {scenarioB && (
                        <Link
                          href={`/scenarios/${scenarioB.id}`}
                          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View & run simulation →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Comparison table */}
                  {scenarioA && scenarioB && comparisonRows.length > 0 && (
                    <div className="border-t border-slate-200 p-5 bg-slate-50/50">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                        Side-by-side comparison
                      </h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 font-medium text-slate-600">
                              Metric
                            </th>
                            <th className="text-right py-2 font-medium text-slate-600">
                              {scenarioA.name}
                            </th>
                            <th className="text-right py-2 font-medium text-slate-600">
                              {scenarioB.name}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row, i) => (
                            <tr
                              key={i}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="py-2.5 text-slate-600">
                                {row.label}
                              </td>
                              <td className="py-2.5 text-right font-medium tabular-nums text-slate-900">
                                {formatVal(row.valA, row.label)}
                              </td>
                              <td className="py-2.5 text-right font-medium tabular-nums text-slate-900">
                                {formatVal(row.valB, row.label)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {scenarioA && scenarioB && (
                <p className="text-sm text-slate-500">
                  Run a simulation on each scenario’s detail page to cache the
                  latest metrics, then return here to compare.
                </p>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
