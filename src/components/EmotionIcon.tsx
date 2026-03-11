"use client";

import type { EmotionalState } from "@metrics-engine/metrics-schema";

interface EmotionIconProps {
  state: EmotionalState | string | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * Simple face-style SVG icons for each emotional state.
 * positive = engaged/smiling, neutral = flat, negative = concerned/frowning.
 */
function EmotionFaceIcon({
  state,
  sizeClass,
  colorClass,
}: {
  state: string;
  sizeClass: string;
  colorClass: string;
}) {
  const faces: Record<string, React.ReactNode> = {
    positive: (
      <>
        <ellipse cx="8" cy="10" rx="1.2" ry="1.5" fill="currentColor" />
        <ellipse cx="16" cy="10" rx="1.2" ry="1.5" fill="currentColor" />
        <path d="M10 15 Q12 17 14 15" fill="none" strokeWidth="1" />
      </>
    ),
    neutral: (
      <>
        <path d="M8 10 L9 10" strokeWidth="1" />
        <path d="M15 10 L16 10" strokeWidth="1" />
        <path d="M10 15 L14 15" strokeWidth="1" />
      </>
    ),
    negative: (
      <>
        <path d="M6 9 L8 8 L10 9" strokeWidth="1" />
        <path d="M14 9 L16 8 L18 9" strokeWidth="1" />
        <path d="M9 16 L12 14 L15 16" fill="none" strokeWidth="1" />
      </>
    ),
  };

  const key = state.toLowerCase();
  const faceContent = faces[key] ?? faces.neutral;

  return (
    <svg
      className={`${sizeClass} ${colorClass}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      {faceContent}
    </svg>
  );
}

/** Color mapping: positive=green, neutral=yellow, negative=red */
export const EMOTION_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  neutral: "text-yellow-400",
  negative: "text-red-400",
};

export default function EmotionIcon({
  state,
  className = "",
  size = "md",
}: EmotionIconProps) {
  const key = (state ?? "neutral").toLowerCase();
  const color = EMOTION_COLORS[key] ?? EMOTION_COLORS.neutral;

  return (
    <EmotionFaceIcon
      state={key}
      sizeClass={`${SIZE_CLASS[size]} ${className}`}
      colorClass={color}
    />
  );
}
