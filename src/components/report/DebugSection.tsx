"use client";

import { useState } from "react";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import { formatOffset } from "@analytics-dashboard/flagged-moments";

interface DebugSectionProps {
  metricsHistory: SessionMetrics[];
}

export function DebugSection({ metricsHistory }: DebugSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const sampleCount = metricsHistory.length;
  const sample = metricsHistory[0];
  const lastSample = metricsHistory[metricsHistory.length - 1];

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(metricsHistory, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">
          Debug: Verification Data
        </h2>
        <span className="text-xs text-cyan-500/80">
          From video replay session
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-gray-500">Sample count: </span>
            <span className="text-white font-mono">{sampleCount}</span>
          </div>
          {sample && (
            <div>
              <span className="text-gray-500">First timestamp: </span>
              <span className="text-gray-300 font-mono text-xs">
                {sample.timestamp}
              </span>
            </div>
          )}
          {lastSample && (
            <div>
              <span className="text-gray-500">Last timestamp: </span>
              <span className="text-gray-300 font-mono text-xs">
                {lastSample.timestamp}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-lg bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800/50 text-xs font-medium transition-colors"
          >
            {expanded ? "Hide" : "Show"} sample payload
          </button>
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-3 py-1.5 rounded-lg bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800/50 text-xs font-medium transition-colors"
          >
            {showTimeline ? "Hide" : "Show"} metrics timeline
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800/50 text-xs font-medium transition-colors"
          >
            Export JSON
          </button>
        </div>

        {expanded && sample && (
          <pre className="p-3 rounded-lg bg-gray-900 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(sample, null, 2)}
          </pre>
        )}

        {showTimeline && metricsHistory.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-xs text-gray-500">
              Eye contact & talk % over time (every 1s sample)
            </p>
            <div className="space-y-1">
              {metricsHistory.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-1 px-2 rounded bg-gray-900/50 text-xs font-mono"
                >
                  <span className="text-gray-500 w-12">
                    {formatOffset(i)}
                  </span>
                  <span className="text-amber-400">
                    T:{Math.round(m.metrics.tutor.eye_contact_score * 100)}%
                  </span>
                  <span className="text-emerald-400">
                    S:{Math.round(m.metrics.student.eye_contact_score * 100)}%
                  </span>
                  <span className="text-gray-400">
                    talk T:{Math.round(m.metrics.tutor.talk_time_percent * 100)}%
                    S:{Math.round(m.metrics.student.talk_time_percent * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
