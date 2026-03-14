"use client";

export type AnalysisTabId =
  | "overview"
  | "profit"
  | "sensitivity"
  | "optimization"
  | "report";

export function AnalysisTabs({
  activeTab,
  onTabChange,
  overviewContent,
  profitContent,
  sensitivityContent,
  optimizationContent,
  reportContent,
}: {
  activeTab: AnalysisTabId;
  onTabChange: (tab: AnalysisTabId) => void;
  overviewContent: React.ReactNode;
  profitContent: React.ReactNode;
  sensitivityContent: React.ReactNode;
  optimizationContent: React.ReactNode;
  reportContent: React.ReactNode;
}) {
  const tabs: { id: AnalysisTabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "profit", label: "Profit distribution" },
    { id: "sensitivity", label: "Sensitivity analysis" },
    { id: "optimization", label: "Optimization" },
    { id: "report", label: "Report" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80">
        <nav className="flex gap-1 p-2 flex-wrap" aria-label="Analysis">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6 min-h-[280px]">
        {activeTab === "overview" && overviewContent}
        {activeTab === "profit" && profitContent}
        {activeTab === "sensitivity" && sensitivityContent}
        {activeTab === "optimization" && optimizationContent}
        {activeTab === "report" && reportContent}
      </div>
    </div>
  );
}
