import type { CorrelationPairResult } from "../actions";
import { detectSpuriousCorrelation } from "../utils/detect-spurious-correlation";

interface PartialCorrelationDisplayProps {
  data: CorrelationPairResult;
}

function formatR(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(4)}`;
}

/** 偏相関係数の表示 + 疑似相関の警告 */
export function PartialCorrelationDisplay({ data }: PartialCorrelationDisplayProps) {
  const hasPartials =
    data.partialRPopulation !== null ||
    data.partialRArea !== null ||
    data.partialRAging !== null ||
    data.partialRDensity !== null;

  if (!hasPartials) return null;

  const isSpurious = detectSpuriousCorrelation(data.pearsonR, [
    data.partialRPopulation,
    data.partialRArea,
    data.partialRAging,
    data.partialRDensity,
  ]);

  return (
    <div className="text-sm space-y-1">
      <p className="text-muted-foreground font-medium">
        偏相関係数（制御変数を除いた相関）:
      </p>
      <div className="flex flex-wrap gap-3">
        {data.partialRPopulation !== null && (
          <span>人口: <span className="font-mono">{formatR(data.partialRPopulation)}</span></span>
        )}
        {data.partialRArea !== null && (
          <span>面積: <span className="font-mono">{formatR(data.partialRArea)}</span></span>
        )}
        {data.partialRAging !== null && (
          <span>高齢化率: <span className="font-mono">{formatR(data.partialRAging)}</span></span>
        )}
        {data.partialRDensity !== null && (
          <span>人口密度: <span className="font-mono">{formatR(data.partialRDensity)}</span></span>
        )}
      </div>
      {isSpurious && (
        <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
          交絡変数の影響が大きく、疑似相関の可能性があります
        </p>
      )}
    </div>
  );
}
