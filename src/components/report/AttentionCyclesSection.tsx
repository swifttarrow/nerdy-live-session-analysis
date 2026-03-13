import type { SessionSummary } from "@analytics-dashboard/summary";
import type { AttentionSegment } from "@analytics-dashboard/attention-cycles";

interface AttentionCyclesSectionProps {
  summary: SessionSummary;
}

const CHART_WIDTH = 400;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 40, left: 45 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function getDataRange(segments: AttentionSegment[]): {
  min: number;
  max: number;
} {
  let min = 1;
  let max = 0;
  for (const seg of segments) {
    min = Math.min(min, seg.tutorEyeContact, seg.studentEyeContact);
    max = Math.max(max, seg.tutorEyeContact, seg.studentEyeContact);
  }
  if (min === max) {
    const pad = Math.max(0.1, min * 0.1);
    return { min: Math.max(0, min - pad), max: Math.min(1, max + pad) };
  }
  return { min, max };
}

function segmentsToPoints(
  segments: AttentionSegment[],
  key: "tutorEyeContact" | "studentEyeContact",
  range: { min: number; max: number }
): string {
  if (segments.length === 0) return "";
  const stepX = segments.length > 1 ? PLOT_WIDTH / (segments.length - 1) : 0;
  const span = range.max - range.min;
  return segments
    .map((seg, i) => {
      const x = PADDING.left + i * stepX;
      const normalized = span > 0 ? (seg[key] - range.min) / span : 0;
      const y = PADDING.top + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");
}

export function AttentionCyclesSection({ summary }: AttentionCyclesSectionProps) {
  const attentionCycles = summary.attentionCycles;
  if (!attentionCycles || attentionCycles.segments.length === 0) return null;

  const segments = attentionCycles.segments;
  const range = getDataRange(segments);
  const tutorPoints = segmentsToPoints(segments, "tutorEyeContact", range);
  const studentPoints = segmentsToPoints(segments, "studentEyeContact", range);

  const yTicks = [range.min, (range.min + range.max) / 2, range.max];

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">Attention Cycles</h2>
      {attentionCycles.pattern && (
        <p className="text-yellow-400 text-sm mb-3 italic">
          {attentionCycles.pattern}
        </p>
      )}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full max-w-full h-auto min-h-[180px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y axis line */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + PLOT_HEIGHT}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          {/* X axis line */}
          <line
            x1={PADDING.left}
            y1={PADDING.top + PLOT_HEIGHT}
            x2={PADDING.left + PLOT_WIDTH}
            y2={PADDING.top + PLOT_HEIGHT}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          {/* Y axis labels (min, mid, max based on data range) */}
          {yTicks.map((v, i) => {
            const normalized =
              range.max > range.min ? (v - range.min) / (range.max - range.min) : 0;
            const y = PADDING.top + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
            return (
              <g key={i}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + PLOT_WIDTH}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-500 text-[10px]"
                >
                  {Math.round(v * 100)}
                </text>
              </g>
            );
          })}
          {/* X axis labels (segment names) */}
          {segments.map((seg, i) => {
            const stepX =
              segments.length > 1 ? PLOT_WIDTH / (segments.length - 1) : 0;
            const x = PADDING.left + i * stepX;
            return (
              <text
                key={seg.label}
                x={x}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                className="fill-gray-500 text-[10px]"
              >
                {seg.label}
              </text>
            );
          })}
          {/* Student attention line (green) */}
          <polyline
            points={studentPoints}
            fill="none"
            stroke="#34d399"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Tutor attention line (amber) */}
          <polyline
            points={tutorPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex gap-6 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ backgroundColor: "#34d399" }}
          />
          Student eye contact
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ backgroundColor: "#f59e0b" }}
          />
          Tutor eye contact
        </span>
      </div>
    </div>
  );
}
