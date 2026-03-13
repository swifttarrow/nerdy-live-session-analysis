import type { Recommendation } from "@analytics-dashboard/recommendations";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  llmRecs: Recommendation[];
  llmLoading: boolean;
  llmError: string | null;
}

export function RecommendationsSection({
  recommendations,
  llmRecs,
  llmLoading,
  llmError,
}: RecommendationsSectionProps) {
  const displayRecs = llmRecs.length > 0 ? llmRecs : recommendations;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-4 space-y-4">
      <h2 className="text-lg font-semibold">Recommendations</h2>
      {displayRecs.map((rec, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border-l-4 ${
            rec.priority === "high"
              ? "bg-red-950/30 border-red-500"
              : rec.priority === "medium"
                ? "bg-yellow-950/30 border-yellow-500"
                : "bg-green-950/30 border-green-500"
          }`}
        >
          <p className="text-sm text-gray-200">{rec.text}</p>
        </div>
      ))}

      {llmLoading && llmRecs.length === 0 && (
        <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-violet-400" />
          Getting AI recommendations...
        </div>
      )}
      {llmError && (
        <p className="text-red-400 text-xs mt-1">
          Could not fetch AI recommendations: {llmError}
        </p>
      )}
    </div>
  );
}
