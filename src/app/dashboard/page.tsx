"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScenarioCard } from "@/components/ScenarioCard";
import { db } from "@/lib/db";
import Link from "next/link";

export default function DashboardPage() {
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

  return (
    <AuthGuard>
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/test-idea"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Test your business idea
            </Link>
            <Link
              href="/scenarios/new"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Create new scenario
            </Link>
            <Link
              href="/scenarios/compare"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Compare scenarios
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            Create and save multiple scenarios (e.g. Base Case, Best Case, Worst
            Case), run simulations, then compare them side by side.
          </p>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading your scenarios…
            </div>
          )}

          {data && !data.scenarios?.length && !isLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-600 mb-4">
                You don&apos;t have any scenarios yet.
              </p>
              <Link
                href="/scenarios/new"
                className="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Create your first scenario
              </Link>
            </div>
          )}

          {data?.scenarios?.length ? (
            <ul className="grid gap-4 sm:grid-cols-1">
              {(data.scenarios as Array<{
                id: string;
                name: string;
                description?: string;
                updatedAt: Date;
                expectedProfit?: number;
                probabilityOfLoss?: number;
                percentile5?: number;
                percentile95?: number;
              }>).map((s) => (
                <li key={s.id}>
                  <ScenarioCard
                    id={s.id}
                    name={s.name}
                    description={s.description ?? ""}
                    updatedAt={s.updatedAt}
                    expectedProfit={s.expectedProfit}
                    probabilityOfLoss={s.probabilityOfLoss}
                    percentile5={s.percentile5}
                    percentile95={s.percentile95}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
