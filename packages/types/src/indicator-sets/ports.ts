// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/ports.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const PORTS_SET: IndicatorSet = {
  "key": "ports",
  "title": "港湾",
  "description": "港湾の貨物・コンテナ・船舶の取扱規模を地域間で比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "port-cargo-total",
      "shortLabel": "海上出入貨物量",
      "role": "primary"
    },
    {
      "rankingKey": "port-cargo-export",
      "shortLabel": "輸出貨物量",
      "role": "secondary"
    },
    {
      "rankingKey": "port-cargo-import",
      "shortLabel": "輸入貨物量",
      "role": "secondary"
    },
    {
      "rankingKey": "port-container-count",
      "shortLabel": "コンテナ個数",
      "role": "primary"
    },
    {
      "rankingKey": "maritime-import-export-cargo",
      "shortLabel": "海上出入貨物(統計体系)",
      "role": "context"
    },
    {
      "rankingKey": "port-inbound-ships",
      "shortLabel": "入港船舶隻数",
      "role": "secondary"
    },
    {
      "rankingKey": "port-ships-tonnage",
      "shortLabel": "入港船舶総トン数",
      "role": "context"
    },
    {
      "rankingKey": "passenger-ship-transport",
      "shortLabel": "旅客船輸送人員",
      "role": "context"
    }
  ],
  "keywords": [
    "港湾",
    "港",
    "貿易",
    "コンテナ",
    "貨物",
    "輸出入",
    "フェリー",
    "海運"
  ],
  "relatedArticleTagKeys": [
    "港湾",
    "貿易",
    "物流",
    "海運"
  ]
};
