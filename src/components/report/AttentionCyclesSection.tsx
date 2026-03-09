import type { SessionSummary } from "@/lib/post-session/summary";

interface AttentionCyclesSectionProps {
  summary: SessionSummary;
}

export function AttentionCyclesSection({ summary }: AttentionCyclesSectionProps) {
  const attentionCycles = summary.attentionCycles;
  if (!attentionCycles || attentionCycles.segments.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">Attention Cycles</h2>
      {attentionCycles.pattern && (
        <p className="text-yellow-400 text-sm mb-3 italic">
          {attentionCycles.pattern}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
              <th className="text-left pb-2">Segment</th>
              <th className="text-right pb-2">Tutor Eye Contact</th>
              <th className="text-right pb-2">Student Eye Contact</th>
            </tr>
          </thead>
          <tbody>
            {attentionCycles.segments.map((seg) => (
              <tr key={seg.label} className="border-b border-gray-800/50">
                <td className="py-2 text-gray-300">{seg.label}</td>
                <td className="py-2 text-right font-medium">
                  {Math.round(seg.tutorEyeContact * 100)}%
                </td>
                <td
                  className={`py-2 text-right font-medium ${
                    seg.studentEyeContact >= 0.5
                      ? "text-green-400"
                      : seg.studentEyeContact >= 0.3
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {Math.round(seg.studentEyeContact * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
