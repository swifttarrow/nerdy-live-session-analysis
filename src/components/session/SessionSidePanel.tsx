"use client";

interface SessionSidePanelProps {
  /** Teacher-only: show metrics panel */
  showMetricsPanel?: boolean;
  metricsPanelOpen: boolean;
  metricsContent: React.ReactNode;
}

export function SessionSidePanel({
  showMetricsPanel = false,
  metricsPanelOpen,
  metricsContent,
}: SessionSidePanelProps) {
  if (!showMetricsPanel || !metricsPanelOpen) return null;

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col min-h-0 max-h-full overflow-hidden self-stretch">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {metricsContent}
      </div>
    </div>
  );
}
