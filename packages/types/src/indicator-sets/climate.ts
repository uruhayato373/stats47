import type { IndicatorSet } from "../indicator-set";

/**
 * 気候テーマ
 *
 * ストーリー軸:
 *  - 日照・気温・降水・降雪に見る「太平洋側 vs 日本海側」「南北」の気候差
 *  - 年間日照時間と快晴日数に表れる晴れの国 / 曇天の地域
 *  - 降水量・降水日数・雪日数が示す暮らしへの影響（豪雪地帯など）
 *
 * データ源: 社会・人口統計体系（B41 自然環境 / 気象）
 * sunshine-map (1km メッシュ年間日照時間ラスター) を本テーマに埋め込む。
 * 旧 /gis-cross/sunshine-map 単独ページは廃止し、2026-05-29 に本テーマを新設して統合。
 */
export const CLIMATE_SET: IndicatorSet = {
  key: "climate",
  title: "気候",
  description:
    "都道府県別の年間日照時間・年平均気温・年間降水量・降雪をランキングとチャートで比較。太平洋側と日本海側、南北の気候差や、晴れの多い地域・豪雪地帯を 47 都道府県のデータで読み解きます。",
  category: "lifestyle",
  usage: "theme",
  metrics: [
    // 日照
    { rankingKey: "annual-sunshine-duration", shortLabel: "年間日照時間", role: "primary" },
    { rankingKey: "annual-clear-days", shortLabel: "快晴日数", role: "secondary" },
    // 気温
    { rankingKey: "average-temperature", shortLabel: "年平均気温", role: "primary" },
    { rankingKey: "maximum-temperature", shortLabel: "最高気温", role: "context" },
    { rankingKey: "lowest-temperature", shortLabel: "最低気温", role: "context" },
    // 降水・降雪
    { rankingKey: "annual-precipitation", shortLabel: "年間降水量", role: "secondary" },
    { rankingKey: "annual-precipitation-days", shortLabel: "降水日数", role: "context" },
    { rankingKey: "annual-snow-days", shortLabel: "雪日数", role: "secondary" },
  ],
  keywords: [
    "気候",
    "日照時間",
    "気温",
    "降水量",
    "降雪",
    "快晴日数",
    "天候",
    "都道府県",
  ],
};
