"use client";

import type { StoryType } from "@/lib/businessStory";

interface BusinessStorySectionProps {
  baseCaseStory: string;
  riskStory: string;
  recommendationStory: string;
  activeStory: StoryType;
  onSelectStory: (story: StoryType) => void;
  className?: string;
}

const TABS: { id: StoryType; label: string }[] = [
  { id: "baseCase", label: "Base Case Story" },
  { id: "risk", label: "Risk Story" },
  { id: "recommendation", label: "Recommendation Story" },
];

export function BusinessStorySection({
  baseCaseStory,
  riskStory,
  recommendationStory,
  activeStory,
  onSelectStory,
  className = "",
}: BusinessStorySectionProps) {
  const stories = { baseCase: baseCaseStory, risk: riskStory, recommendation: recommendationStory };
  const currentText = stories[activeStory];

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-3">
        Business Story
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Plain-language narratives from your simulation results. Switch views to
        see base case, risk, or recommendation.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectStory(id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeStory === id
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 min-h-[6rem]">
        <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
          {currentText}
        </p>
      </div>
    </div>
  );
}
