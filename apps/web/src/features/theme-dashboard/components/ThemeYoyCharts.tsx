"use client";

import { MetricYoyChoroplethSection } from "./MetricYoyChoroplethSection";

/**
 * テーマ別 YoY コロプレスチャート集約コンポーネント。
 *
 * 各テーマに対し、関連 metric の YoY (year-over-year) 5年移動平均アニメを
 * 1〜N 個並べて表示する。データは apps/web/public/themes/<theme>/yoy-*.json
 * から fetch される (build-yoy-timeseries.cjs バッチで生成)。
 *
 * 配色 clamp は指標ごとに手調整 (急変動指標は大きめ、緩やかな指標は小さめ) 。
 */

interface YoyChartConfig {
  dataUrl: string;
  title: string;
  subtitle: string;
  colorClamp: number;
}

const THEME_YOY_CHARTS: Record<string, YoyChartConfig[]> = {
  "population-dynamics": [
    {
      dataUrl: "/themes/population-dynamics/yoy-total-population.json",
      title: "人口の前年度比",
      subtitle:
        "東京一極集中がいつ始まり、平成不況で中断し、2000年代に再加速したかを色で可視化",
      colorClamp: 0.01,
    },
    {
      dataUrl: "/themes/population-dynamics/yoy-total-fertility-rate.json",
      title: "合計特殊出生率の前年度比",
      subtitle:
        "1989年「1.57ショック」以降の変化と、東京と地方の出生力逆転を色で追う",
      colorClamp: 0.02,
    },
    {
      dataUrl: "/themes/population-dynamics/yoy-marriages.json",
      title: "婚姻率の前年度比",
      subtitle: "長期低下とコロナ禍急減を可視化",
      colorClamp: 0.03,
    },
    {
      dataUrl: "/themes/population-dynamics/yoy-divorces.json",
      title: "離婚率の前年度比",
      subtitle: "平成不況期の上昇と2000年代以降の改善",
      colorClamp: 0.05,
    },
  ],
  safety: [
    {
      dataUrl: "/themes/safety/yoy-suicides.json",
      title: "自殺率の前年度比",
      subtitle: "1998年金融危機での急増 → 2009年ピーク → 政策で大幅改善まで",
      colorClamp: 0.05,
    },
    {
      dataUrl: "/themes/safety/yoy-traffic-deaths.json",
      title: "交通事故死者率の前年度比",
      subtitle: "1970年代の高水準から安全技術と取締強化で半世紀かけ大幅減",
      colorClamp: 0.05,
    },
    {
      dataUrl: "/themes/safety/yoy-public-assistance.json",
      title: "生活保護世帯数の前年度比",
      subtitle:
        "リーマンショック後の急増、2014年ピーク、コロナ禍での再上昇",
      colorClamp: 0.05,
    },
  ],
  manufacturing: [
    {
      dataUrl:
        "/themes/manufacturing/yoy-manufacturing-shipment.json",
      title: "製造品出荷額の前年度比",
      subtitle:
        "バブル期 → リーマンショック → 円安/円高サイクルが景気循環として見える",
      colorClamp: 0.1,
    },
  ],
  "local-economy": [
    {
      dataUrl: "/themes/local-economy/yoy-agricultural-output.json",
      title: "農業産出額の前年度比",
      subtitle:
        "全国的な長期低下傾向、北海道のシェア拡大、果樹/酪農地域の変動",
      colorClamp: 0.05,
    },
  ],
  tourism: [
    {
      dataUrl: "/themes/tourism/yoy-overnight-guests.json",
      title: "延べ宿泊客数の前年度比",
      subtitle: "コロナ禍での半減 → 4年でV字回復、東京・京都・大阪の集中",
      colorClamp: 0.2,
    },
    {
      dataUrl: "/themes/tourism/yoy-overnight-guests-foreign.json",
      title: "外国人延べ宿泊客数の前年度比",
      subtitle:
        "インバウンドブーム → コロナ全停止 → 再加速、東京と地方リゾートの差",
      colorClamp: 0.5,
    },
  ],
};

export function ThemeYoyCharts({
  themeKey,
  highlightAreaCode,
}: {
  themeKey: string;
  highlightAreaCode?: string;
}) {
  const charts = THEME_YOY_CHARTS[themeKey];
  if (!charts || charts.length === 0) return null;
  return (
    <div className="space-y-3">
      {charts.map((c) => (
        <MetricYoyChoroplethSection
          key={c.dataUrl}
          dataUrl={c.dataUrl}
          title={c.title}
          subtitle={c.subtitle}
          colorClamp={c.colorClamp}
          highlightAreaCode={highlightAreaCode ? highlightAreaCode.slice(0, 2) : undefined}
        />
      ))}
    </div>
  );
}
