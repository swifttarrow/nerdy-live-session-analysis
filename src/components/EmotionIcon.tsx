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
 * Each represents the expression (eyes, brows, mouth) associated with that state.
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
    engaged: (
      <>
        <ellipse cx="8" cy="10" rx="1.2" ry="1.5" fill="currentColor" />
        <ellipse cx="16" cy="10" rx="1.2" ry="1.5" fill="currentColor" />
        <path d="M10 15 Q12 17 14 15" fill="none" strokeWidth="1" />
      </>
    ),
    attentive: (
      <>
        <circle cx="8" cy="10" r="1.5" fill="currentColor" />
        <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      </>
    ),
    curious: (
      <>
        <path d="M7 9.5 L9 10.5 L7 11.5" fill="none" strokeWidth="1.2" />
        <path d="M15 9.5 L17 10.5 L15 11.5" fill="none" strokeWidth="1.2" />
        <path d="M6 8 L8 8" strokeWidth="1" />
        <path d="M16 8 L18 8" strokeWidth="1" />
      </>
    ),
    confident: (
      <>
        <path d="M8 10.5 Q8 9 9.5 9 Q10 9 10 10" fill="none" strokeWidth="1" />
        <path d="M14 10.5 Q14 9 15.5 9 Q16 9 16 10" fill="none" strokeWidth="1" />
        <path d="M10 15 Q12 17 14 15" fill="none" strokeWidth="1" />
      </>
    ),
    understanding: (
      <>
        <path d="M8 10 L9 11 L8 12" fill="none" strokeWidth="1" />
        <path d="M16 10 L17 11 L16 12" fill="none" strokeWidth="1" />
        <path d="M10 15 L12 17 L14 15" fill="none" strokeWidth="1" />
      </>
    ),
    excited: (
      <>
        <circle cx="8" cy="10" r="1.2" fill="currentColor" />
        <circle cx="16" cy="10" r="1.2" fill="currentColor" />
        <path d="M7 8 L8 7 M9 8 L8 7" strokeWidth="0.8" />
        <path d="M15 8 L16 7 M17 8 L16 7" strokeWidth="0.8" />
      </>
    ),
    focused: (
      <>
        <path d="M7 10 L9 10" strokeWidth="1.2" />
        <path d="M15 10 L17 10" strokeWidth="1.2" />
        <path d="M6 8.5 L8 9.5" strokeWidth="1" />
        <path d="M18 8.5 L16 9.5" strokeWidth="1" />
      </>
    ),
    neutral: (
      <>
        <path d="M8 10 L9 10" strokeWidth="1" />
        <path d="M15 10 L16 10" strokeWidth="1" />
        <path d="M10 15 L14 15" strokeWidth="1" />
      </>
    ),
    thinking: (
      <>
        <path d="M7 10 L9 10" strokeWidth="1" />
        <path d="M15 10 L17 10" strokeWidth="1" />
        <path d="M7 8 L9 8" strokeWidth="0.8" />
        <path d="M15 8 L17 8" strokeWidth="0.8" />
      </>
    ),
    confused: (
      <>
        <path d="M7 9.5 L9 10.5 L7 11.5" fill="none" strokeWidth="1" />
        <path d="M15 9.5 L17 10.5 L15 11.5" fill="none" strokeWidth="1" />
        <path d="M8 8 L8 7" strokeWidth="1" />
        <path d="M16 8 L16 7" strokeWidth="1" />
      </>
    ),
    frustrated: (
      <>
        <path d="M6 9 L8 8 L10 9" strokeWidth="1" />
        <path d="M14 9 L16 8 L18 9" strokeWidth="1" />
        <path d="M9 15 L12 17 L15 15" fill="none" strokeWidth="1" />
      </>
    ),
    tired: (
      <>
        <path d="M7 10.5 L9 10.5" strokeWidth="1" />
        <path d="M15 10.5 L17 10.5" strokeWidth="1" />
        <path d="M10 15 L12 14 L14 15" fill="none" strokeWidth="1" />
      </>
    ),
    defeated: (
      <>
        <path d="M7 10.5 L9 10.5" strokeWidth="1" />
        <path d="M15 10.5 L17 10.5" strokeWidth="1" />
        <path d="M9 16 L12 14 L15 16" fill="none" strokeWidth="1" />
      </>
    ),
    bored: (
      <>
        <path d="M7 10 L9 10" strokeWidth="1" />
        <path d="M15 10 L17 10" strokeWidth="1" />
        <path d="M10 15 L14 15" strokeWidth="1" />
      </>
    ),
    anxious: (
      <>
        <path d="M7 10 L9 10" strokeWidth="1" />
        <path d="M15 10 L17 10" strokeWidth="1" />
        <path d="M8 9 L8 8" strokeWidth="0.8" />
        <path d="M16 9 L16 8" strokeWidth="0.8" />
        <path d="M10 15 Q12 16 14 15" fill="none" strokeWidth="1" />
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

/** Color mapping: positive=green, neutral=gray/blue, negative=amber/orange/rose */
const EMOTION_COLORS: Record<string, string> = {
  engaged: "text-emerald-400",
  attentive: "text-emerald-400",
  curious: "text-emerald-400",
  confident: "text-emerald-400",
  understanding: "text-emerald-400",
  excited: "text-emerald-400",
  focused: "text-emerald-400",
  neutral: "text-gray-400",
  thinking: "text-blue-400",
  confused: "text-amber-400",
  frustrated: "text-orange-400",
  tired: "text-amber-400",
  defeated: "text-rose-400",
  bored: "text-amber-400",
  anxious: "text-orange-400",
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

export { EMOTION_COLORS };
