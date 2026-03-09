"use client";

import { useEffect, useState } from "react";
import type { SessionReport } from "@analytics-dashboard/report";
import type { Recommendation } from "@analytics-dashboard/recommendations";

export function useReportData() {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [llmRecs, setLlmRecs] = useState<Recommendation[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sessionlens-report");
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch {
        console.warn("Could not parse session report");
      }
    }
  }, []);

  const fetchLlmRecommendations = async () => {
    if (!report) return;
    setLlmLoading(true);
    setLlmError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report.summary),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLlmRecs(data.recommendations ?? []);
    } catch (err) {
      setLlmError(
        err instanceof Error ? err.message : "Failed to fetch recommendations"
      );
    } finally {
      setLlmLoading(false);
    }
  };

  return { report, llmRecs, llmLoading, llmError, fetchLlmRecommendations };
}
