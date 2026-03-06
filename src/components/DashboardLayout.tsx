"use client";

import { db } from "@/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { user } = db.useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    db.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-slate-900">
            RiskLens
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}
