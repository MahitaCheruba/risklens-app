"use client";

import { AdoptionChart } from "@/components/AdoptionChart";
import { runAdoptionABM } from "@/lib/abm";
import { db } from "@/lib/db";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const DEFAULT_INPUTS = {
  numCustomers: 1000,
  initialAdopters: 50,
  adoptionProbability: 0.05,
  influenceStrength: 0.3,
  churnProbability: 0.02,
  timeSteps: 50,
};

export default function ScenarioABMPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = db.useQuery(
    id
      ? { scenarios: { $: { where: { id } }, owner: {} } }
      : null
  );

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [result, setResult] = useState<ReturnType<typeof runAdoptionABM> | null>(null);

  const scenario = useMemo(() => {
    const list = data?.scenarios ?? [];
    return list[0] ?? null;
  }, [data]);

  const handleRun = () => {
    const res = runAdoptionABM(inputs);
    setResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-800 font-medium"
        >
          ← Dashboard
        </Link>
        <Link
          href={id ? `/scenarios/${id}` : "/dashboard"}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {scenario ? scenario.name : "Scenario"} (back)
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          ABM mode — Adoption simulation
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Agent-based adoption with word-of-mouth and churn. Adjust parameters and run.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Total customers</span>
            <input
              type="number"
              min={1}
              value={inputs.numCustomers}
              onChange={(e) =>
                setInputs((p) => ({ ...p, numCustomers: Number(e.target.value) || 1 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Initial adopters</span>
            <input
              type="number"
              min={0}
              value={inputs.initialAdopters}
              onChange={(e) =>
                setInputs((p) => ({ ...p, initialAdopters: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Time steps</span>
            <input
              type="number"
              min={1}
              max={500}
              value={inputs.timeSteps}
              onChange={(e) =>
                setInputs((p) => ({ ...p, timeSteps: Number(e.target.value) || 1 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Adoption probability (0–1)</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={inputs.adoptionProbability}
              onChange={(e) =>
                setInputs((p) => ({ ...p, adoptionProbability: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Influence strength (0–1)</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={inputs.influenceStrength}
              onChange={(e) =>
                setInputs((p) => ({ ...p, influenceStrength: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Churn probability (0–1)</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={inputs.churnProbability}
              onChange={(e) =>
                setInputs((p) => ({ ...p, churnProbability: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleRun}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Run adoption simulation
        </button>
      </section>

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
            Results
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Final adopters</p>
              <p className="text-lg font-semibold text-slate-900">{result.finalAdopters}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Final adoption rate</p>
              <p className="text-lg font-semibold text-slate-900">
                {(result.finalAdoptionRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Total churn events</p>
              <p className="text-lg font-semibold text-slate-900">{result.totalChurnEvents}</p>
            </div>
          </div>
          <AdoptionChart
            adoptionOverTime={result.adoptionOverTime}
            numCustomers={inputs.numCustomers}
          />
        </section>
      )}
    </div>
  );
}
