import type { StoredSessionSummary } from "@/lib/session/session-store";

export type TrendDirection = "up" | "down" | "stable";

export interface MetricTrend {
  metric: string;
  current: number;
  previousAvg: number;
  direction: TrendDirection;
  changePercent: number;
}

export interface SessionTrends {
  sessionCount: number;
  trends: MetricTrend[];
  summary: string;
}

function direction(change: number, threshold = 0.05): TrendDirection {
  if (change > threshold) return "up";
  if (change < -threshold) return "down";
  return "stable";
}

/**
 * Compute trends comparing current session to prior N sessions.
 * Returns null if fewer than 2 sessions in history.
 */
export function computeTrends(
  current: StoredSessionSummary,
  history: StoredSessionSummary[],
  lookback: number = 3
): SessionTrends | null {
  // history includes current as first element; skip it
  const prior = history.filter((s) => s.sessionId !== current.sessionId).slice(0, lookback);
  if (prior.length === 0) return null;

  function avg(fn: (s: StoredSessionSummary) => number): number {
    return prior.reduce((sum, s) => sum + fn(s), 0) / prior.length;
  }

  const metrics: Array<{ key: string; label: string; fn: (s: StoredSessionSummary) => number }> = [
    { key: "studentTalkRatio", label: "Student talk ratio", fn: (s) => s.studentTalkRatio },
    { key: "avgStudentEyeContact", label: "Student eye contact", fn: (s) => s.avgStudentEyeContact },
    { key: "avgTutorEyeContact", label: "Tutor eye contact", fn: (s) => s.avgTutorEyeContact },
    { key: "engagementScore", label: "Engagement score", fn: (s) => s.engagementScore },
  ];

  const trends: MetricTrend[] = metrics.map(({ label, fn }) => {
    const curr = fn(current);
    const prevAvg = avg(fn);
    const change = prevAvg > 0 ? (curr - prevAvg) / prevAvg : 0;
    return {
      metric: label,
      current: curr,
      previousAvg: prevAvg,
      direction: direction(change),
      changePercent: Math.round(change * 100),
    };
  });

  const improved = trends.filter((t) => t.direction === "up").length;
  const declined = trends.filter((t) => t.direction === "down").length;

  let summary: string;
  if (improved > declined) {
    summary = `Improving vs. last ${prior.length} session${prior.length > 1 ? "s" : ""}`;
  } else if (declined > improved) {
    summary = `Declining vs. last ${prior.length} session${prior.length > 1 ? "s" : ""}`;
  } else {
    summary = `Consistent with last ${prior.length} session${prior.length > 1 ? "s" : ""}`;
  }

  return { sessionCount: prior.length + 1, trends, summary };
}
