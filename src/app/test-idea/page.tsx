"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestIdeaPage() {
  const { user } = db.useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [variableCost, setVariableCost] = useState("");
  const [fixedCost, setFixedCost] = useState("");
  const [demandMean, setDemandMean] = useState("");
  const [demandStdDev, setDemandStdDev] = useState("");
  const [numSimulations, setNumSimulations] = useState("10000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);

    const sellingPriceNum = parseFloat(sellingPrice);
    const variableCostNum = parseFloat(variableCost);
    const fixedCostNum = parseFloat(fixedCost);
    const demandMeanNum = parseFloat(demandMean);
    const demandStdDevNum = parseFloat(demandStdDev);
    const numSims = parseInt(numSimulations, 10) || 10000;

    if (!businessName.trim()) {
      setError("Business name is required.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(sellingPriceNum) || sellingPriceNum < 0) {
      setError("Selling price must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(variableCostNum) || variableCostNum < 0) {
      setError("Variable cost must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(fixedCostNum) || fixedCostNum < 0) {
      setError("Fixed cost must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(demandMeanNum) || demandMeanNum < 0) {
      setError("Expected demand mean must be a non-negative number.");
      setSaving(false);
      return;
    }
    if (Number.isNaN(demandStdDevNum) || demandStdDevNum < 0) {
      setError("Demand standard deviation must be a non-negative number.");
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
    const description = businessType.trim()
      ? `Industry: ${businessType.trim()}`
      : "";

    const attrs = {
      name: businessName.trim(),
      description,
      fixedCost: fixedCostNum,
      sellingPrice: sellingPriceNum,
      demandDistributionType: "normal",
      demandMean: demandMeanNum,
      demandStdDev: demandStdDevNum,
      demandMin: null,
      demandMax: null,
      demandMode: null,
      variableCostDistributionType: "fixed",
      variableCostMin: null,
      variableCostMode: variableCostNum,
      variableCostMax: null,
      numSimulations: numSims,
      createdAt: now,
      updatedAt: now,
    };

    try {
      db.transact([
        db.tx.scenarios[scenarioId].update(attrs as Record<string, unknown>),
        db.tx.scenarios[scenarioId].link({ owner: user.id }),
      ]);
      router.replace(`/scenarios/${scenarioId}?autoRun=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <AuthGuard>
      <DashboardLayout title="Test your business idea">
        <div className="max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Dashboard
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Test your business idea
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Enter your assumptions. We’ll run a Monte Carlo simulation and
              show you results on the next page.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="businessName" className={labelClass}>
                  Business name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. My Coffee Shop"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessType" className={labelClass}>
                  Business type / industry
                </label>
                <input
                  id="businessType"
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Retail, Food & Beverage"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <label htmlFor="variableCost" className={labelClass}>
                    Variable cost per unit ($)
                  </label>
                  <input
                    id="variableCost"
                    type="number"
                    min={0}
                    step="any"
                    value={variableCost}
                    onChange={(e) => setVariableCost(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="demandMean" className={labelClass}>
                    Expected demand (mean units)
                  </label>
                  <input
                    id="demandMean"
                    type="number"
                    min={0}
                    step="any"
                    value={demandMean}
                    onChange={(e) => setDemandMean(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="demandStdDev" className={labelClass}>
                    Demand standard deviation
                  </label>
                  <input
                    id="demandStdDev"
                    type="number"
                    min={0}
                    step="any"
                    value={demandStdDev}
                    onChange={(e) => setDemandStdDev(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="max-w-xs">
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

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {saving ? "Saving…" : "Test my idea"}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
