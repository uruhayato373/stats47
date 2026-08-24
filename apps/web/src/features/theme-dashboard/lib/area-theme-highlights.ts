interface AreaThemeHighlightSource {
  indicatorDataMap: Record<
    string,
    {
      rankingItem: {
        title: string;
        readerLabel?: string;
        unit: string;
      };
      rankingValues: Array<{
        areaCode: string;
        value: number | null;
        unit: string;
        yearName: string;
      }>;
    }
  >;
}

export interface AreaThemeHighlight {
  key: string;
  title: string;
  value: number;
  unit: string;
  yearName: string;
}

/**
 * 都道府県×テーマページに、その県固有の観測値をサーバー描画するための要約。
 * chart の選択状態だけに県差を閉じ込めず、本文にも検索エンジンが読める固有情報を置く。
 */
export function getAreaThemeHighlights(
  data: AreaThemeHighlightSource,
  areaCode: string,
  limit = 3,
): AreaThemeHighlight[] {
  const highlights: AreaThemeHighlight[] = [];
  for (const [key, indicator] of Object.entries(data.indicatorDataMap)) {
    const target = indicator.rankingValues.find(
      (value) => value.areaCode === areaCode && Number.isFinite(value.value),
    );
    if (target?.value === null || target?.value === undefined) continue;
    highlights.push({
      key,
      title: indicator.rankingItem.readerLabel ?? indicator.rankingItem.title,
      value: target.value,
      unit: target.unit || indicator.rankingItem.unit,
      yearName: target.yearName,
    });
    if (highlights.length >= limit) break;
  }
  return highlights;
}
