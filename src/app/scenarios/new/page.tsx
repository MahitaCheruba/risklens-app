"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMAND_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "triangular", label: "Triangular" },
  { value: "uniform", label: "Uniform" },
] as const;

const VARIABLE_COST_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "triangular", label: "Triangular" },
  { value: "uniform", label: "Uniform" },
] as const;

export default function NewScenarioPage() {
  const { user } = db.useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fixedCost, setFixedCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [demandDistributionType, setDemandDistributionType] = useState<
    "normal" | "triangular" | "uniform"
  >("normal");
  const [demandMean, setDemandMean] = useState("");
  const [demandStdDev, setDemandStdDev] = useState("");
  const [demandMin, setDemandMin] = useState("");
  const [demandMax, setDemandMax] = useState("");
  const [demandMode, setDemandMode] = useState("");
  const [variableCostDistributionType, setVariableCostDistributionType] =
    useState<"triangular" | "uniform" | "fixed">("fixed");
  const [variableCostMin, setVariableCostMin] = useState("");
  const [variableCostMode, setVariableCostMode] = useState("");
  const [variableCostMax, setVariableCostMax] = useState("");
  const [numSimulations, setNumSimulations] = useState("10000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);

    const fixedCostNum = parseFloat(fixedCost);
    const sellingPriceNum = parseFloat(sellingPrice);
    const numSims = parseInt(numSimulations, 10) || 10000;

    if (!name.trim()) {
      setError("Scenario name is required.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(fixedCostNum) || fixedCostNum < 0) {
      setError("Fixed cost must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(sellingPriceNum) || sellingPriceNum < 0) {
      setError("Selling price must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (numSims < 100 || numSims > 1_000_000) {
      setError("Number of simulations must be between 100 and 1,000,000.");
      setSaving(false);
      return;
    }

    const now = new Date();
    const scenarioId = id();

    const attrs: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      fixedCost: fixedCostNum,
      sellingPrice: sellingPriceNum,
      demandDistributionType,
      variableCostDistributionType,
      numSimulations: numSims,
      createdAt: now,
      updatedAt: now,
    };

    if (demandDistributionType === "normal") {
      const mean = parseFloat(demandMean);
      const stdDev = parseFloat(demandStdDev);
      if (Number.isNaN(mean) || Number.isNaN(stdDev) || stdDev < 0) {
        setError("For Normal demand, mean and standard deviation must be valid (std dev ≥ 0).");
        setSaving(false);
        return;
      }
      attrs.demandMean = mean;
      attrs.demandStdDev = stdDev;
      attrs.demandMin = null;
      attrs.demandMax = null;
    } else if (demandDistributionType === "triangular") {
      const min = parseFloat(demandMin);
      const max = parseFloat(demandMax);
      const mode = demandMode ? parseFloat(demandMode) : (min + max) / 2;
      if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
        setError("For Triangular demand, min must be less than max.");
        setSaving(false);
        return;
      }
      attrs.demandMin = min;
      attrs.demandMax = max;
      attrs.demandMean = null;
      attrs.demandStdDev = null;
      attrs.demandMode = mode;
    } else {
      const min = parseFloat(demandMin);
      const max = parseFloat(demandMax);
      if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
        setError("For Uniform demand, min must be less than max.");
        setSaving(false);
        return;
      }
      attrs.demandMin = min;
      attrs.demandMax = max;
      attrs.demandMean = null;
      attrs.demandStdDev = null;
    }

    if (variableCostDistributionType === "fixed") {
      const v = parseFloat(variableCostMode || variableCostMin || variableCostMax || "0");
      if (Number.isNaN(v) || v < 0) {
        setError("For Fixed variable cost, enter a non-negative value.");
        setSaving(false);
        return;
      }
      attrs.variableCostMode = v;
      attrs.variableCostMin = null;
      attrs.variableCostMax = null;
    } else if (variableCostDistributionType === "triangular") {
      const min = parseFloat(variableCostMin);
      const max = parseFloat(variableCostMax);
      const mode = variableCostMode ? parseFloat(variableCostMode) : (min + max) / 2;
      if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
        setError("For Triangular variable cost, min must be less than max.");
        setSaving(false);
        return;
      }
      attrs.variableCostMin = min;
      attrs.variableCostMax = max;
      attrs.variableCostMode = mode;
    } else {
      const min = parseFloat(variableCostMin);
      const max = parseFloat(variableCostMax);
      if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
        setError("For Uniform variable cost, min must be less than max.");
        setSaving(false);
        return;
      }
      attrs.variableCostMin = min;
      attrs.variableCostMax = max;
      attrs.variableCostMode = null;
    }

    try {
      db.transact([
        db.tx.scenarios[scenarioId].update(attrs as Record<string, unknown>),
        db.tx.scenarios[scenarioId].link({ owner: user.id }),
      ]);
      router.replace(`/scenarios/${scenarioId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AuthGuard>
      <DashboardLayout title="New scenario">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="name" className={labelClass}>
              Scenario name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="description" className={labelClass}>
              Short description
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fixedCost" className={labelClass}>
                Fixed cost ($)
              </label>
              <input
                id="fixedCost"
                type="number"
                min={0}
                step="any"
                value={fixedCost}
                onChange={(e) => setFixedCost(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="sellingPrice" className={labelClass}>
                Selling price ($)
              </label>
              <input
                id="sellingPrice"
                type="number"
                min={0}
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="text-sm font-semibold text-slate-800">
              Demand distribution
            </legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {DEMAND_TYPES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="demandDistributionType"
                    value={value}
                    checked={demandDistributionType === value}
                    onChange={() => setDemandDistributionType(value)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            {demandDistributionType === "normal" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-600">Mean</label>
                  <input
                    type="number"
                    step="any"
                    value={demandMean}
                    onChange={(e) => setDemandMean(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Standard deviation</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={demandStdDev}
                    onChange={(e) => setDemandStdDev(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
            {demandDistributionType === "triangular" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-600">Min</label>
                  <input type="number" step="any" value={demandMin} onChange={(e) => setDemandMin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Mode</label>
                  <input type="number" step="any" value={demandMode} onChange={(e) => setDemandMode(e.target.value)} placeholder="(optional)" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Max</label>
                  <input type="number" step="any" value={demandMax} onChange={(e) => setDemandMax(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
            {demandDistributionType === "uniform" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-600">Min</label>
                  <input type="number" step="any" value={demandMin} onChange={(e) => setDemandMin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Max</label>
                  <input type="number" step="any" value={demandMax} onChange={(e) => setDemandMax(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="text-sm font-semibold text-slate-800">
              Variable cost distribution
            </legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {VARIABLE_COST_TYPES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="variableCostDistributionType"
                    value={value}
                    checked={variableCostDistributionType === value}
                    onChange={() => setVariableCostDistributionType(value)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            {variableCostDistributionType === "fixed" && (
              <div className="mt-4">
                <label className="block text-sm text-slate-600">Cost per unit ($)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={variableCostMode || variableCostMin || variableCostMax}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVariableCostMode(v);
                    setVariableCostMin(v);
                    setVariableCostMax(v);
                  }}
                  className={`${inputClass} max-w-xs`}
                />
              </div>
            )}
            {variableCostDistributionType === "triangular" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-600">Min</label>
                  <input type="number" min={0} step="any" value={variableCostMin} onChange={(e) => setVariableCostMin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Mode</label>
                  <input type="number" min={0} step="any" value={variableCostMode} onChange={(e) => setVariableCostMode(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Max</label>
                  <input type="number" min={0} step="any" value={variableCostMax} onChange={(e) => setVariableCostMax(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
            {variableCostDistributionType === "uniform" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-600">Min</label>
                  <input type="number" min={0} step="any" value={variableCostMin} onChange={(e) => setVariableCostMin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Max</label>
                  <input type="number" min={0} step="any" value={variableCostMax} onChange={(e) => setVariableCostMax(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
          </fieldset>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-xs">
            <label htmlFor="numSimulations" className={labelClass}>
              Number of simulations
            </label>
            <input
              id="numSimulations"
              type="number"
              min={100}
              max={1_000_000}
              value={numSimulations}
              onChange={(e) => setNumSimulations(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save scenario"}
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </DashboardLayout>
    </AuthGuard>
  );
}
