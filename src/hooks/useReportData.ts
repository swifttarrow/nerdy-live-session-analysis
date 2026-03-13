"use client";

import { useEffect, useState } from "react";
import type { SessionReport } from "@analytics-dashboard/report";
import type { Recommendation } from "@analytics-dashboard/recommendations";
import { STORAGE_KEYS, API_PATHS } from "@/lib/constants";

export function useReportData() {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [llmRecs, setLlmRecs] = useState<Recommendation[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.REPORT);
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {
        console.warn("Could not parse session report");
      }
    }
  }, []);

  // Fire AI recommendations fetch automatically when report loads (non-blocking)
  useEffect(() => {
    if (!report) return;
    setLlmLoading(true);
    setLlmError(null);
    fetch(API_PATHS.RECOMMENDATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report.summary),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setLlmRecs(data.recommendations ?? []);
      })
      .catch((err) => {
        setLlmError(
          err instanceof Error ? err.message : "Failed to fetch recommendations"
        );
      })
      .finally(() => setLlmLoading(false));
  }, [report?.sessionId]);

  return { report, llmRecs, llmLoading, llmError };
}
