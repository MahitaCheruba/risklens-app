"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScenarioCard } from "@/components/ScenarioCard";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
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
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/scenarios/new"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Create New Scenario
            </Link>
            <Link
              href="/scenarios/compare"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Compare scenarios
            </Link>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {isLoading && (
            <div className="text-slate-500">Loading your scenarios...</div>
          )}

          {data && !data.scenarios?.length && !isLoading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="mb-4">You don&apos;t have any scenarios yet.</p>
              <Link
                href="/scenarios/new"
                className="text-indigo-600 font-medium hover:text-indigo-500"
              >
                Create your first scenario
              </Link>
            </div>
          )}

          {data?.scenarios?.length ? (
            <ul className="grid gap-4 sm:grid-cols-1">
              {(data.scenarios as Array<{ id: string; name: string; description?: string; updatedAt: Date; expectedProfit?: number; probabilityOfLoss?: number; percentile5?: number; percentile95?: number }>).map((s) => (
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
