---
name: Web 競合の指標数ベンチマーク（todo-ran / uub / stats47）
description: 都道府県統計サイトの保有指標数。2026-07-11 更新で stats47 は 2,141 本と競合を超え、供給(数)は制約でなくなった。ボトルネックは需要+CTR
type: project
originSessionId: c8417f1f-0b16-4d1a-afe9-f4b7fa18c5a6
---
Web 競合 上位 2 社の保有指標数と stats47 の実態。

| サイト | 指標数 | URL |
|---|---|---|
| **todo-ran**（とどラン） | 1,501 ランキング | https://todo-ran.com/ |
| **uub.jp/pdr**（都道府県データランキング） | 263 テーマ / 1,843 データセット | https://uub.jp/pdr/ |
| **stats47**（自分） | **2,141 公開ランキング**（active metric 2,142 / KNOWN 2,141・2026-07-11 実測） | — |

## ★2026-07-11 転換: 「数」で競合を超えた → 供給は制約でなくなった

2026-04-27 時点は「約 533 指標で 3 倍差の劣後」だったが、その後の量産で **stats47 は 2,141 本と todo-ran(1,501)/uub(1,843) を上回った**。データ鮮度も 63% が 2023 年以降と良好。**「指標数を 1,500 に増やす」という旧目標は達成済み。**

**Why:** 12 週(W16-W27)の GSC 実測で、供給ではなく需要+CTR がボトルネックと判明:
- 公開 2,141 本のうち **41% (877) が 12 週間ゼロ表示**（一度も検索表示されない）
- クリックを得たのは 25% (541) のみ、**上位 50 本で全クリックの 49% を占有**（完全なべき分布）
- 723 本は「impressions あり×click ゼロ」= 需要はあるのに CTR で取りこぼし

**How to apply:**
- **e-Stat 全展開はしない（低 ROI）**。既存の 41% がゼロ表示の状態で同種の自動生成を数千本足しても限界クリック≒0、加えて thin-content で index bloat（crawled-not-indexed 増）のリスク。
- **需要ファーストで投資する**（優先順）:
  1. 既存 CTR 改修 — 「impあり×clickゼロ」723 本の seoTitle を curiosity gap 化（→ `RANKING-CTR-01`、第1バッチ13本適用済）。ブログ CTR 改修のランキング版。
  2. 需要ギャップ展開 — GSC で「検索されているのに専用ランキングが無い」トピックだけ e-Stat 展開（全部ではなく需要が数字で確認できた分だけ）。
  3. ゼロ表示 877 本の診断 — not-indexed（活性化可能）か no-demand（受容）かを sample で切り分け。
- 競合 todo-ran は 10 年超の被リンク蓄積で勝つ点は不変 → 量でなく差別化軸（市区町村×動画 / 相関 / public API）+ 既存資産の CTR/需要活用で攻める。
- 関連: `.claude/todo/04_改善バックログ.md#RANKING-CTR-01` / [[project_ranking_publish_pipeline_gap]] / [[feedback_backlog_ranking_key_audit]]
