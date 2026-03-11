"use client";

interface EyeContactOverlayProps {
  /** Eye contact score 0–1, or undefined when no face detected */
  score: number;
  faceDetected?: boolean;
  /** Role for color theming */
  variant?: "tutor" | "student";
}

/**
 * Overlay indicator for eye contact status in debug mode.
 * Positioned in the upper-center of the video (typical eye region).
 * Green = good eye contact, amber = low, red = very low, gray = no face.
 */
export function EyeContactOverlay({
  score,
  faceDetected = true,
  variant = "tutor",
}: EyeContactOverlayProps) {
  const noFace = !faceDetected;
  const isGood = score >= 0.6;
  const isLow = score >= 0.35 && score < 0.6;
  const isVeryLow = score < 0.35 && !noFace;

  const dotColor = noFace
    ? "bg-gray-500"
    : isGood
      ? "bg-green-500"
      : isLow
        ? "bg-amber-500"
        : "bg-red-500";

  const ringColor = noFace
    ? "ring-gray-600"
    : isGood
      ? "ring-green-400"
      : isLow
        ? "ring-amber-400"
        : "ring-red-400";

  const label = noFace
    ? "No face"
    : isGood
      ? "Eye contact"
      : isLow
        ? "Looking away"
        : "Low eye contact";

  const accentColor =
    variant === "tutor"
      ? "border-amber-500/50"
      : "border-emerald-500/50";

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-start justify-center pt-[22%]"
      aria-hidden
    >
      <div
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border ${accentColor} bg-black/40 backdrop-blur-sm transition-all duration-300`}
      >
        <div
          className={`w-4 h-4 rounded-full ${dotColor} ring-2 ${ringColor} ring-offset-2 ring-offset-transparent transition-colors`}
          title={label}
        />
        <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
