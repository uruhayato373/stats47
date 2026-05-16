# 食消費（economy）— ブログ記事企画

> 生成日: 2026-05-06
> 既存指標数: 21件（麺類・豆腐・納豆・昆布・寿司・餃子・アイス等）
> 企画数: 1件（PHASE-12 実施対象）

---

## 記事企画: noodle-consumption-prefecture-character

- title: "うどん県・そば県・ラーメン県に日本は三分割される"
- subtitle: "うどん消費量1位香川 vs ラーメン支出1位山形の4倍差"
- description: "都道府県別の麺類消費データを分析。乾うどん・そば消費量、外食ラーメン支出で47都道府県を比較すると、西日本のうどん圏・東日本のそば圏・山形を頂点とするラーメン圏という3つの文化圏が浮かび上がる。家計調査2024年最新データで麺類の県民性を徹底可視化。"
- category: economy
- tags: [家計調査, うどん, そば, ラーメン, 食文化, 都道府県ランキング, 消費支出]
- target: 食文化・地域差に興味のある20〜50代
- seo_keywords: [うどん消費量 都道府県, そば消費量 ランキング, ラーメン消費 都道府県, 麺類 県民性, うどん そば ラーメン 地域差]

### 使用データ

| 指標 | ソース | metric_key | 備考 |
|---|---|---|---|
| 乾うどん・そば消費量 | stats_prefecture | fresh-udon-soba-consumption-quantity | 世帯あたり年間g |
| 乾うどん・そば消費支出 | stats_prefecture | dried-udon-soba-consumption-expenditure | |
| うどん・そば外食支出 | stats_prefecture | soba-udon-dining-consumption-expenditure | |
| ラーメン外食支出 | stats_prefecture | ramen-dining-consumption-expenditure | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | fresh-udon-soba-consumption-quantity | 乾うどん消費量の県別分布（西高東低が視覚的） |
| 2 | tile-grid-map | ramen-dining-consumption-expenditure | ラーメン外食支出の県別分布（東北・北陸強い） |
| 3 | scatter | うどん消費量 × ラーメン支出 | うどん圏とラーメン圏の逆相関を可視化 |
| 4 | bar | ramen-dining-consumption-expenditure top/bottom10 | ラーメン支出ランキング |
| 5 | summary-findings | 3指標の総合 | 三文化圏まとめ |

### 骨子

1. **リード**: 「うどん県は香川だけじゃない」──家計調査で見ると、麺類の消費は日本を3つの文化圏に分割する
2. **Section 1 うどん圏**: 乾うどん消費量ランキング。四国・関西が上位。1位香川はX倍
3. **Section 2 ラーメン圏**: 外食ラーメン支出ランキング。山形・福島・秋田の東北勢が圧倒
4. **Section 3 そば圏**: 乾そば消費・そば外食で長野・福島・山形が強い。ラーメンとそばは両立する
5. **Section 4 三文化圏マップ**: scatter でうどん vs ラーメンの逆相関を示す
6. **Section 5 なぜ分かれるのか**: 歴史・気候・小麦生産量との関連（簡潔に）
7. **関連リンク**: `/ranking/fresh-udon-soba-consumption-quantity`, `/ranking/ramen-dining-consumption-expenditure`, `/ranking/soba-udon-dining-consumption-expenditure`

### SEO 差別化ポイント

- ランキングページと競合しない切り口: 「三分割」「文化圏」という地理的視点
- 複数クエリを1記事で捕捉: うどん/そば/ラーメン各クエリ
- 意外性のある発見: 「山形がラーメン1位」「うどん消費量は香川だけでなく西日本全体」
