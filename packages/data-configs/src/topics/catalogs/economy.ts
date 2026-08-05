import type { CategoryTopicCatalog } from "../types";

/**
 * 企業・家計・経済 (816 件) — 全カテゴリで最大
 *
 * 694 件が家計調査品目で、`cdCat01` が公式の費目コードを持つ。タイトルの語彙
 * (「りんご」「もやし」…) で分類しようとすると 58% しか割れないが、コードなら
 * 決定的に分類できる。実測した階層:
 *
 *   先頭 2 桁 = 10 大費目   01 食料 / 02 住居 / 03 光熱・水道 / 04 家具・家事用品 /
 *                          05 被服及び履物 / 06 保健医療 / 07 交通・通信 / 08 教育 /
 *                          09 教養娯楽 / 10 その他の消費支出
 *   続く 2 桁 = 中分類     0102 魚介類 / 0105 野菜・海藻 / 0111 酒類 …
 *
 * 食料 (01) だけで 336 件あり 1 カードに収まらないので**食料のみ中分類 12 群**に割り、
 * 他の 9 大費目は大費目のまま 1 群にする。非家計調査 122 件は物価・貯蓄・所得などで
 * タイトル規則で拾う。
 */
export const ECONOMY_TOPICS: CategoryTopicCatalog = {
  categoryKey: "economy",
  topics: [
    // --- 非家計調査を先に置く。家計調査コードを持たないので誤爆しない ---
    {
      key: "consumer-prices",
      label: "物価",
      matchers: [{ kind: "title", pattern: "消費者物価|物価指数" }],
    },
    {
      key: "income",
      label: "所得・可処分所得",
      matchers: [
        { kind: "title", pattern: "可処分所得|県民所得|所得$|の平均年収$|消費性向|エンゲル係数" },
      ],
    },
    {
      key: "savings",
      label: "貯蓄・負債",
      matchers: [
        { kind: "title", pattern: "貯蓄|負債|預貯金|有価証券|生命保険現在高|預金残高|貸出残高|貯蓄率" },
      ],
    },
    {
      key: "household-budget",
      label: "家計の費目構成",
      matchers: [{ kind: "title", pattern: "費割合$|費（全世帯）$|^消費支出$|^教育費$" }],
    },
    {
      key: "regional-economy",
      label: "地域経済",
      matchers: [{ kind: "title", pattern: "総生産|経済成長|事業所|企業" }],
    },

    // --- 家計調査: 食料 (01) を中分類で 12 群 ---
    { key: "food-grain", label: "食料 — 穀類", matchers: [{ kind: "kakei-cat01", prefixes: ["0101"] }] },
    { key: "food-seafood", label: "食料 — 魚介類", matchers: [{ kind: "kakei-cat01", prefixes: ["0102"] }] },
    { key: "food-meat", label: "食料 — 肉類", matchers: [{ kind: "kakei-cat01", prefixes: ["0103"] }] },
    { key: "food-dairy", label: "食料 — 乳卵類", matchers: [{ kind: "kakei-cat01", prefixes: ["0104"] }] },
    { key: "food-vegetable", label: "食料 — 野菜・海藻", matchers: [{ kind: "kakei-cat01", prefixes: ["0105"] }] },
    { key: "food-fruit", label: "食料 — 果物", matchers: [{ kind: "kakei-cat01", prefixes: ["0106"] }] },
    { key: "food-seasoning", label: "食料 — 油脂・調味料", matchers: [{ kind: "kakei-cat01", prefixes: ["0107"] }] },
    { key: "food-sweets", label: "食料 — 菓子類", matchers: [{ kind: "kakei-cat01", prefixes: ["0108"] }] },
    { key: "food-prepared", label: "食料 — 調理食品", matchers: [{ kind: "kakei-cat01", prefixes: ["0109"] }] },
    { key: "food-beverage", label: "食料 — 飲料", matchers: [{ kind: "kakei-cat01", prefixes: ["0110"] }] },
    { key: "food-alcohol", label: "食料 — 酒類", matchers: [{ kind: "kakei-cat01", prefixes: ["0111"] }] },
    { key: "food-eating-out", label: "食料 — 外食", matchers: [{ kind: "kakei-cat01", prefixes: ["0112"] }] },
    // 食料の総額など中分類に落ちないもの (0100 / 0011 / 0009)
    {
      key: "food-total",
      label: "食料 — 全体",
      matchers: [{ kind: "kakei-cat01", prefixes: ["0100", "0011", "0009"] }],
    },

    // --- 家計調査: 食料以外は大費目で 1 群ずつ ---
    { key: "housing", label: "住居", matchers: [{ kind: "kakei-cat01", prefixes: ["02"] }] },
    { key: "utilities", label: "光熱・水道", matchers: [{ kind: "kakei-cat01", prefixes: ["03"] }] },
    { key: "furniture", label: "家具・家事用品", matchers: [{ kind: "kakei-cat01", prefixes: ["04"] }] },
    { key: "clothing", label: "被服及び履物", matchers: [{ kind: "kakei-cat01", prefixes: ["05"] }] },
    { key: "health", label: "保健医療", matchers: [{ kind: "kakei-cat01", prefixes: ["06"] }] },
    { key: "transport", label: "交通・通信", matchers: [{ kind: "kakei-cat01", prefixes: ["07"] }] },
    { key: "education", label: "教育", matchers: [{ kind: "kakei-cat01", prefixes: ["08"] }] },
    { key: "culture", label: "教養娯楽", matchers: [{ kind: "kakei-cat01", prefixes: ["09"] }] },
    { key: "misc", label: "その他の消費支出", matchers: [{ kind: "kakei-cat01", prefixes: ["10"] }] },
  ],
};
