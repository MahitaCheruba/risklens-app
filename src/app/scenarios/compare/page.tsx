"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
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

  type ScenarioItem = {
    id: string;
    name: string;
    expectedProfit?: number;
    probabilityOfLoss?: number;
    percentile5?: number;
    percentile95?: number;
  };

  const scenarios = useMemo(
    () => (data?.scenarios ?? []) as ScenarioItem[],
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

  return (
    <AuthGuard>
      <DashboardLayout title="Compare scenarios">
        <div className="space-y-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm text-slate-500 hover:text-slate-700"
          >
            ← Dashboard
          </Link>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {isLoading && (
            <div className="text-slate-500">Loading scenarios...</div>
          )}

          {!isLoading && scenarios.length < 2 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
              You need at least two scenarios to compare.{" "}
              <Link href="/scenarios/new" className="text-indigo-600 hover:underline">
                Create another scenario
              </Link>
              .
            </div>
          )}

          {!isLoading && scenarios.length >= 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Scenario A
                  </label>
                  <select
                    value={idA}
                    onChange={(e) => setIdA(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Scenario B
                  </label>
                  <select
                    value={idB}
                    onChange={(e) => setIdB(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
                <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="p-4 border-b sm:border-b-0 sm:border-r border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      {scenarioA ? scenarioA.name : "—"}
                    </h3>
                    {scenarioA ? (
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-slate-500">Expected profit</dt>
                          <dd className="font-medium">
                            {scenarioA.expectedProfit != null
                              ? formatCurrency(scenarioA.expectedProfit)
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Probability of loss</dt>
                          <dd className="font-medium">
                            {scenarioA.probabilityOfLoss != null
                              ? `${scenarioA.probabilityOfLoss.toFixed(1)}%`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">5th–95th percentile</dt>
                          <dd className="font-medium">
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
                        className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                      >
                        View & run simulation →
                      </Link>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      {scenarioB ? scenarioB.name : "—"}
                    </h3>
                    {scenarioB ? (
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-slate-500">Expected profit</dt>
                          <dd className="font-medium">
                            {scenarioB.expectedProfit != null
                              ? formatCurrency(scenarioB.expectedProfit)
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Probability of loss</dt>
                          <dd className="font-medium">
                            {scenarioB.probabilityOfLoss != null
                              ? `${scenarioB.probabilityOfLoss.toFixed(1)}%`
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">5th–95th percentile</dt>
                          <dd className="font-medium">
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
                        className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                      >
                        View & run simulation →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {scenarioA && scenarioB && (
                <p className="text-sm text-slate-500">
                  Run a simulation on each scenario’s detail page to see and cache
                  the latest metrics, then return here to compare.
                </p>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
