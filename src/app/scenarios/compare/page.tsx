"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  buildComparisonRows,
  formatComparisonValue,
  formatCurrency,
  getBreakEvens,
  type ScenarioComparisonRecord,
} from "@/lib/scenarioComparison";
import { db } from "@/lib/db";
import Link from "next/link";
import { useMemo, useState } from "react";

const MAX_SCENARIOS_TO_COMPARE = 6;

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
    () => (data?.scenarios ?? []) as ScenarioComparisonRecord[],
    [data]
  );

  /** Selected scenario IDs in order (e.g. [baseId, bestId, worstId]). */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedScenarios = useMemo(
    () =>
      selectedIds
        .map((id) => scenarios.find((s) => s.id === id))
        .filter(Boolean) as ScenarioComparisonRecord[],
    [scenarios, selectedIds]
  );

  const breakEvens = useMemo(
    () => getBreakEvens(selectedScenarios),
    [selectedScenarios]
  );

  const comparisonRows = useMemo(
    () => buildComparisonRows(selectedScenarios, breakEvens),
    [selectedScenarios, breakEvens]
  );

  const availableToAdd = useMemo(
    () => scenarios.filter((s) => !selectedIds.includes(s.id)),
    [scenarios, selectedIds]
  );

  const canAddMore =
    selectedIds.length < MAX_SCENARIOS_TO_COMPARE && availableToAdd.length > 0;

  const addScenario = (id: string) => {
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= MAX_SCENARIOS_TO_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeScenario = (index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Scenario comparison">
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
              You need at least two scenarios to compare (e.g. Base Case, Best
              Case, Worst Case).{" "}
              <Link
                href="/scenarios/new"
                className="text-indigo-600 font-medium hover:underline"
              >
                Create scenarios
              </Link>
            </div>
          )}

          {!isLoading && scenarios.length >= 2 && (
            <>
              {/* Scenario selectors */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">
                  Choose scenarios to compare
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Add up to {MAX_SCENARIOS_TO_COMPARE} scenarios (e.g. Base Case,
                  Best Case, Worst Case). Run a simulation on each scenario’s
                  detail page to refresh metrics.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedIds.map((id, index) => {
                    const s = selectedScenarios[index];
                    return (
                      <div
                        key={id}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-900">
                          {s?.name ?? "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScenario(index)}
                          className="text-slate-400 hover:text-slate-600"
                          aria-label={`Remove ${s?.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {canAddMore && (
                    <select
                      value=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) addScenario(v);
                        e.target.value = "";
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">+ Add scenario…</option>
                      {availableToAdd.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Per-scenario summary cards (one per selected) */}
              {selectedScenarios.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedScenarios.map((scenario, index) => {
                    const breakEven = breakEvens[index] ?? null;
                    return (
                      <div
                        key={scenario.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {scenario.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeScenario(index)}
                            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            aria-label={`Remove ${scenario.name}`}
                          >
                            ×
                          </button>
                        </div>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div>
                            <dt className="text-slate-500">Expected profit</dt>
                            <dd className="font-semibold text-slate-900">
                              {scenario.expectedProfit != null
                                ? formatCurrency(scenario.expectedProfit)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Probability of loss</dt>
                            <dd className="font-semibold">
                              {scenario.probabilityOfLoss != null
                                ? `${scenario.probabilityOfLoss.toFixed(1)}%`
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Break-even demand</dt>
                            <dd className="font-semibold">
                              {breakEven != null
                                ? `${breakEven.toLocaleString()} units`
                                : "Not achievable"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">5th – 95th %</dt>
                            <dd className="font-semibold">
                              {scenario.percentile5 != null &&
                              scenario.percentile95 != null
                                ? `${formatCurrency(scenario.percentile5)} – ${formatCurrency(scenario.percentile95)}`
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                        <Link
                          href={`/scenarios/${scenario.id}`}
                          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View & run simulation →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comparison table (all selected scenarios) */}
              {selectedScenarios.length >= 2 && comparisonRows.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-200 p-5 bg-slate-50/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Side-by-side comparison
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">
                            Metric
                          </th>
                          {selectedScenarios.map((s) => (
                            <th
                              key={s.id}
                              className="text-right py-3 px-4 font-medium text-slate-600"
                            >
                              {s.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-2.5 px-4 text-slate-600">
                              {row.label}
                            </td>
                            {row.values.map((val, j) => (
                              <td
                                key={j}
                                className="py-2.5 px-4 text-right font-medium tabular-nums text-slate-900"
                              >
                                {typeof val === "string"
                                  ? val
                                  : formatComparisonValue(val, row.label)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedScenarios.length >= 2 && (
                <p className="text-sm text-slate-500">
                  Run a simulation on each scenario’s detail page to refresh
                  metrics, then return here to compare.
                </p>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
