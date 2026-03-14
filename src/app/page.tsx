"use client";

import { db } from "@/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isLoading, user, error } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">RiskLens</h1>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">
            Evaluate uncertain business decisions with Monte Carlo simulation
          </h2>
          {error && (
            <p className="text-sm text-red-600">
              Auth is temporarily unavailable; you can still read about RiskLens
              or try signing in again in a moment.
            </p>
          )}
          <p className="text-slate-600 text-lg max-w-2xl">
            RiskLens helps business students and aspiring analysts model scenarios
            with assumptions about price, demand, variable cost, and fixed cost.
            Choose probability distributions for uncertain inputs, run thousands
            of simulations, and see expected profit, probability of loss, and
            percentile ranges before making a decision.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get started — Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
