import type { IndicatorSet } from "../indicator-set";

/**
 * 港湾テーマ
 *
 * ストーリー軸:
 *  - 貿易立国日本を支える港湾の取扱貨物量・コンテナ・旅客の都道府県格差
 *  - 工業地帯（太平洋ベルト）に集中する大型港湾 vs 地方港
 *  - 輸出入の玄関口としての機能と、フェリー・旅客の地域交通機能
 *
 * データ源: 港湾統計（国交省）+ 社会・人口統計体系（海上出入貨物・旅客船輸送）
 * 旧 /ports 独立ページを 2026-05-28 に本テーマへ統合（301 redirect）。
 */
export const PORTS_SET: IndicatorSet = {
  key: "ports",
  title: "港湾",
  description:
    "都道府県別の港湾取扱貨物量・コンテナ個数・入港船舶・港湾旅客数を地図とランキングで比較。貿易立国日本の玄関口がどの地域に集中するのか、輸出入貨物の偏在やフェリー・旅客船の地域交通機能を47都道府県のデータで可視化します。",
  category: "economy",
  usage: "theme",
  metrics: [
    // 貨物（取扱量）
    { rankingKey: "port-cargo-total", shortLabel: "海上出入貨物量", role: "primary" },
    { rankingKey: "port-cargo-export", shortLabel: "輸出貨物量", role: "secondary" },
    { rankingKey: "port-cargo-import", shortLabel: "輸入貨物量", role: "secondary" },
    { rankingKey: "port-container-count", shortLabel: "コンテナ個数", role: "primary" },
    { rankingKey: "maritime-import-export-cargo", shortLabel: "海上出入貨物(統計体系)", role: "context" },
    // 船舶
    { rankingKey: "port-inbound-ships", shortLabel: "入港船舶隻数", role: "secondary" },
    { rankingKey: "port-ships-tonnage", shortLabel: "入港船舶総トン数", role: "secondary" },
    // 旅客
    { rankingKey: "port-passengers-total", shortLabel: "港湾旅客数", role: "primary" },
    { rankingKey: "passenger-ship-transport", shortLabel: "旅客船輸送人員", role: "secondary" },
  ],
  keywords: ["港湾", "港", "貿易", "コンテナ", "貨物", "輸出入", "フェリー", "海運"],
  relatedArticleTagKeys: ["港湾", "貿易", "物流", "海運"],
};
