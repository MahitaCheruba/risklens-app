"use client";

import { AdoptionChart } from "@/components/AdoptionChart";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/db";
import { runAdoptionABM, type ABMAdoptionResult } from "@/lib/abm";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden";

export default function ScenarioABMPage() {
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

  const scenario = (data?.scenarios ?? [])[0] as unknown as
    | { name: string }
    | undefined;

  const [numCustomers, setNumCustomers] = useState(1000);
  const [initialAdopters, setInitialAdopters] = useState(50);
  const [adoptionProbability, setAdoptionProbability] = useState(0.05);
  const [influenceStrength, setInfluenceStrength] = useState(0.3);
  const [churnProbability, setChurnProbability] = useState(0.02);
  const [timeSteps, setTimeSteps] = useState(24);

  const [result, setResult] = useState<ABMAdoptionResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      try {
        const res = runAdoptionABM({
          numCustomers,
          initialAdopters,
          adoptionProbability,
          influenceStrength,
          churnProbability,
          timeSteps,
        });
        setResult(res);
      } finally {
        setRunning(false);
      }
    }, 0);
  }, [
    numCustomers,
    initialAdopters,
    adoptionProbability,
    influenceStrength,
    churnProbability,
    timeSteps,
  ]);

  const inputClass =
    "mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AuthGuard>
      <DashboardLayout title="ABM – Adoption">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/scenarios/${id}`}
              className="text-sm text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Back to scenario
            </Link>
          </div>

          <section className={cardClass}>
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Agent-based adoption (ABM)
              </h2>
              {scenario && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Scenario: {scenario.name}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Separate simulation mode. Customer adoption with word-of-mouth
                and churn. Does not replace Monte Carlo results.
              </p>
            </div>
            <div className="p-5 space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                  {error.message}
                </div>
              )}

              {isLoading ? (
                <p className="text-slate-500">Loading scenario…</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className={labelClass}>Number of customers</label>
                      <input
                        type="number"
                        min={10}
                        max={100000}
                        value={numCustomers}
                        onChange={(e) =>
                          setNumCustomers(Number(e.target.value) || 10)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Initial adopters</label>
                      <input
                        type="number"
                        min={0}
                        max={numCustomers}
                        value={initialAdopters}
                        onChange={(e) =>
                          setInitialAdopters(Number(e.target.value) || 0)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Adoption probability (0–1)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={adoptionProbability}
                        onChange={(e) =>
                          setAdoptionProbability(
                            Number(e.target.value) || 0
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Influence strength (word-of-mouth)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={2}
                        step={0.05}
                        value={influenceStrength}
                        onChange={(e) =>
                          setInfluenceStrength(Number(e.target.value) || 0)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Churn probability (0–1)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={churnProbability}
                        onChange={(e) =>
                          setChurnProbability(Number(e.target.value) || 0)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Time steps</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={timeSteps}
                        onChange={(e) =>
                          setTimeSteps(Number(e.target.value) || 1)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={running}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    {running ? "Running ABM…" : "Run ABM"}
                  </button>
                </>
              )}
            </div>
          </section>

          {result && (
            <section className={cardClass + " p-5"}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
                Results
              </h3>
              <AdoptionChart
                adoptionOverTime={result.adoptionOverTime}
                numCustomers={numCustomers}
                className="mb-6"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Final adoption rate
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {(result.finalAdoptionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Final adopters
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {result.finalAdopters.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Total churn events
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {result.totalChurnEvents.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Time steps
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {result.adoptionOverTime.length - 1}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
                  Interpretation
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {result.finalAdoptionRate >= 0.5
                    ? "Adoption reaches a strong level; word-of-mouth and base adoption probability drive growth. Monitor churn to sustain the base."
                    : result.finalAdoptionRate >= 0.2
                      ? "Moderate adoption. Consider increasing initial adopters or influence strength to accelerate diffusion."
                      : "Adoption remains low. Increase adoption probability, influence strength, or initial adopters to improve uptake."}
                  {result.totalChurnEvents > result.finalAdopters && " Churn is significant; reducing churn probability may improve retention."}
                </p>
              </div>
            </section>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
