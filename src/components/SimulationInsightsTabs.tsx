"use client";

export type SimulationInsightTab = "profit" | "sensitivity" | "heatmap";

export function SimulationInsightsTabs({
  activeTab,
  onTabChange,
  profitContent,
  sensitivityContent,
  heatmapContent,
}: {
  activeTab: SimulationInsightTab;
  onTabChange: (tab: SimulationInsightTab) => void;
  profitContent: React.ReactNode;
  sensitivityContent: React.ReactNode;
  heatmapContent: React.ReactNode;
}) {
  const tabs: { id: SimulationInsightTab; label: string }[] = [
    { id: "profit", label: "Profit distribution" },
    { id: "sensitivity", label: "Sensitivity analysis" },
    { id: "heatmap", label: "Risk heatmap" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80">
        <nav className="flex gap-1 p-2" aria-label="Simulation insights">
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
      <div className="p-5 min-h-[280px]">
        {activeTab === "profit" && profitContent}
        {activeTab === "sensitivity" && sensitivityContent}
        {activeTab === "heatmap" && heatmapContent}
      </div>
    </div>
  );
}
