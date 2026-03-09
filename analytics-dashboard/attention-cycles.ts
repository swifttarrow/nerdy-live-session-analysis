import type { SessionMetrics } from "@metrics-engine/metrics-schema";

export interface AttentionSegment {
  label: string;          // e.g. "Beginning", "Middle", "End"
  startIndex: number;
  endIndex: number;
  tutorEyeContact: number;
  studentEyeContact: number;
}

export interface AttentionCycles {
  segments: AttentionSegment[];
  /** Human-readable pattern description, e.g. "Attention drifted in the middle segment" */
  pattern: string | null;
}

/**
 * Divide metrics history into N segments and compute per-segment eye contact averages.
 */
export function segmentAttention(
  metricsHistory: SessionMetrics[],
  numSegments: number = 3
): AttentionCycles {
  const n = metricsHistory.length;
  if (n === 0) return { segments: [], pattern: null };

  const actualSegments = Math.min(numSegments, n);
  const size = Math.ceil(n / actualSegments);
  const labels =
    actualSegments === 3
      ? ["Beginning", "Middle", "End"]
      : Array.from({ length: actualSegments }, (_, i) => `Segment ${i + 1}`);

  const segments: AttentionSegment[] = [];

  for (let i = 0; i < actualSegments; i++) {
    const start = i * size;
    const end = Math.min(start + size, n);
    const slice = metricsHistory.slice(start, end);

    const tutorAvg = slice.reduce((s, m) => s + m.metrics.tutor.eye_contact_score, 0) / slice.length;
    const studentAvg = slice.reduce((s, m) => s + m.metrics.student.eye_contact_score, 0) / slice.length;

    segments.push({
      label: labels[i] ?? `Segment ${i + 1}`,
      startIndex: start,
      endIndex: end - 1,
      tutorEyeContact: Math.round(tutorAvg * 100) / 100,
      studentEyeContact: Math.round(studentAvg * 100) / 100,
    });
  }

  const pattern = detectDriftPattern(segments);
  return { segments, pattern };
}

/**
 * Detect if middle segments have notably lower attention than start/end.
 * Returns a description string or null if no pattern detected.
 */
export function detectDriftPattern(segments: AttentionSegment[]): string | null {
  if (segments.length < 3) return null;

  const first = segments[0].studentEyeContact;
  const last = segments[segments.length - 1].studentEyeContact;
  const midSegments = segments.slice(1, -1);
  const avgMid = midSegments.reduce((s, seg) => s + seg.studentEyeContact, 0) / midSegments.length;
  const avgBoundary = (first + last) / 2;

  if (avgBoundary - avgMid > 0.2) {
    return "Student attention drifted in the middle of the session";
  }

  // Check if attention declined progressively
  const declining = segments.every(
    (seg, i) => i === 0 || seg.studentEyeContact <= segments[i - 1].studentEyeContact + 0.05
  );
  const totalDrop = first - last;
  if (declining && totalDrop > 0.25) {
    return "Student attention declined progressively through the session";
  }

  return null;
}
