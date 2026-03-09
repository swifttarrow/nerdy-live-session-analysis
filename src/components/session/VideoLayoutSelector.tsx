"use client";

import type { VideoLayout } from "./VideoFeeds";

interface VideoLayoutSelectorProps {
  value: VideoLayout;
  onChange: (layout: VideoLayout) => void;
}

const iconClass = "w-4 h-4";

function SideBySideIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="9" height="16" rx="1" />
      <rect x="13" y="4" width="9" height="16" rx="1" />
    </svg>
  );
}

function FocusSelfIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function FocusOtherIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function VideoLayoutSelector({ value, onChange }: VideoLayoutSelectorProps) {
  const btnClass = (layout: VideoLayout) =>
    `p-2 rounded-md transition-colors ${
      value === layout
        ? "bg-gray-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-700"
    }`;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Video layout">
      <button
        type="button"
        onClick={() => onChange("side-by-side")}
        className={btnClass("side-by-side")}
        title="Side by side"
      >
        <SideBySideIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("focus-self")}
        className={btnClass("focus-self")}
        title="Focus on me"
      >
        <FocusSelfIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("focus-other")}
        className={btnClass("focus-other")}
        title="Focus on other"
      >
        <FocusOtherIcon />
      </button>
    </div>
  );
}
