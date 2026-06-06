---
type: implementation-plan
status: phase-0-active
created: 2026-05-23
updated: 2026-05-23
target_period: 2026-05 〜 2028-05 (24 ヶ月)
baseline:
  monthly_pv: 25000
  weekly_clicks: 797
  weekly_impressions: 31810
  ctr: 0.0251
  position: 8.64
  indexed_pages: 1163
  measured_at: 2026-W21
goal:
  monthly_pv: 2500000
  multiplier: 100
related_files:
  - docs/02_実装計画/01_実装ロードマップ.md
  - docs/02_実装計画/seo-todo-unify-phase-1-3.md
  - docs/02_実装計画/improvement-backlog.md
phases:
  - { id: 0, name: "漏れ止め", weeks: "W21-W28", multiplier: 1.5, target_monthly_pv: 38000, status: implementation-complete, effect_measurement_due: "2026-06-20" }
  - { id: 1, name: "面の拡張", weeks: "W29-W44", multiplier: 4, target_monthly_pv: 150000, status: partial-implementation-360-cities-ssg, prep_complete: true }
  - { id: 2, name: "権威化", weeks: "W45-2027-W20", multiplier: 3, target_monthly_pv: 450000, status: prep-complete-pending-execution, prep_complete: true }
  - { id: 3, name: "ループ起動", weeks: "2027-W21-W44", multiplier: 2.5, target_monthly_pv: 1100000, status: planned }
  - { id: 4, name: "横展開", weeks: "2027-W45-2028-W20", multiplier: 2.5, target_monthly_pv: 2500000, status: planned }
---

# 月間 PV 100 倍戦略 (24 ヶ月)

> 25K PV/月 → 2,500K PV/月。Phase 0〜4 を掛け算で 100 倍にする 24 ヶ月計画。
> 短期 (12 ヶ月) ストレッチ目標は 10 倍 (= 月 250K PV)、24 ヶ月で 100 倍。

## Context

2026-W21 時点のベースライン (実測):

| 指標 | 値 | 出典 |
|---|---|---|
| 月間 PV | ~25,000 | `.claude/state/metrics/ga4/history.csv` 直近 4 週平均 |
| 週間 clicks | 797 | `.claude/state/metrics/gsc/LATEST.md` |
| 週間 impressions | 31,810 | 同上 |
| CTR | 2.51% | 同上 |
| 平均掲載順位 | 8.64 | 同上 |
| Indexed pages | 1,163 | 同上 |
| Sitemap 総 URL 数 | 2,385 | `https://stats47.jp/sitemap.xml` (sitemap-index 8 個合算) |
| 指標数 (metrics) | 1,994 | `docs/02_実装計画/01_実装ロードマップ.md` W21 実測 |
| ブログ記事数 | 182 | 同上 |
| 市区町村ページ実 indexed | 21 / 25,785 (0.08%) | `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W21/pages.csv` |

**結論**: ベースライン 25K PV/月 を 24 ヶ月で 100 倍するには、単一施策では不可能。**4 段階の倍率を掛けて 100 倍**にする設計とする。

---

## Phase Roadmap (掛け算で 100 倍)

| Phase | 期間 | 倍率 | 主軸 | 月 PV 着地 |
|---|---|---|---|---|
| **Phase 0: 漏れ止め** | 2026-W21〜W28 (~2ヶ月) | ×1.5 | /ranking インデックス率改善 + CTR 改修 | 25K → 38K |
| **Phase 1: 面の拡張** | 2026-W29〜W44 (~4ヶ月) | ×4 | 市区町村ページ復活 + 指標 2K→5K + 内部リンク再構築 | 38K → 150K |
| **Phase 2: 権威化** | 2026-W45〜2027-W20 (~6ヶ月) | ×3 | 公務員×AI×統計でニッチ独占、高品質ブログ 50 本、note 収益化 | 150K → 450K |
| **Phase 3: ループ起動** | 2027-W21〜W44 (~6ヶ月) | ×2.5 | YouTube 47 県シリーズ growth → 指名検索 + Newsletter | 450K → 1.1M |
| **Phase 4: 横展開** | 2027-W45〜2028-W20 (~6ヶ月) | ×2.5 | 多言語 (英語 AI 翻訳) + ツール化 (比較・API) + 隣接領域 | 1.1M → 2.5M |

**累積倍率**: 1.5 × 4 × 3 × 2.5 × 2.5 ≈ **112 倍**

各倍率は「ベースラインに対する追加寄与」を独立に試算したものではなく、**Phase 完了時点の累積 PV を 1 つ前 Phase 完了時点の何倍にするか**を表す。

---

## なぜこの順序か (各 Phase の根拠)

### Phase 0: 漏れ止め (×1.5)

**[仮説]** 既存 /ranking 821 URL のうち、indexed 率を 43% → 70% に上げれば clicks +60%、さらに CTR を 2.51% → 3.5% に上げれば clicks +40%。Phase 0 内で重なる効果も加味して保守的に ×1.5。

**根拠データ**:
- W21 snapshot で /ranking 821 URLs / sitemap /ranking 1,913 → 43% しか indexed されていない
- CTR 2.51% は業界平均 (Backlinko 2023 で position 7-10 帯の CTR は 3-5%) より低い
- INDEXING-AUTO-01 (in-progress, due 2026-06-14) と CTR-AUTO-01 (in-progress, due 2026-06-21) で既に着手済み施策がある

### Phase 1: 面の拡張 (×4)

**[仮説]** 市区町村ページ 25,785 URL のうち、上位 5,000 URL を内部リンク + 内容強化 + sitemap 復活で indexed 化すれば、1 URL あたり月 3 PV × 5,000 = 月 15,000 PV 追加 (現状の +60%)。同時に指標 1,994 → 5,000 に拡張で更に +PV。

**根拠データ**:
- /blog インデックス率 78% (142/183) は達成可能ライン → /areas/cities もここまで持っていける
- 市区町村 21 URLs で 33 impressions → 1.5 imp/URL/週 → 5,000 URL × 1.5 imp = 7,500 imp/週 追加
- とどラン (1,501 指標) / uub (1,843 指標) を既に超えている (stats47=1,994) ので、指標数自体ではなく **品質と SEO** が次の差別化軸

**主要リスク**: 市区町村ページの品質が薄いまま sitemap 復活すると、Google が「site quality 低い」と判定して全体 ranking を下げる可能性 → Phase 0 で内容強化テンプレートを設計してから本格展開する

### Phase 2: 権威化 (×3)

**[仮説]** 「公務員 × AI × 統計」ニッチで stats47 を権威化することで、E-E-A-T シグナル強化 → 既存ページの ranking 全体底上げ。高品質ブログ 50 本で被リンク獲得 + 指名検索の素地。

**根拠データ**:
- 現在の運営者プロフィール (KAZU、元県庁職員 20 年) が ペルソナ 3 (行政・自治体関係者) と高親和
- ペルソナ 3 主軸の Two-track 戦略は既に確定済み (`docs/00_プロジェクト管理/04_ターゲットペルソナ.md`)
- /blog CTR は /ranking より高く、長文コンテンツは AdSense Page RPM も高い

### Phase 3: ループ起動 (×2.5)

**[仮説]** YouTube 47 県シリーズ (現在 78,552 累計再生) を月間 10 万再生規模に育てると、(a) YouTube → 指名検索「stats47」発生、(b) YouTube → 概要欄リンク経由の直接流入、(c) 高品質コンテンツ起点の被リンク獲得、の 3 経路で PV 倍増。

**根拠データ**:
- まとめ動画 `wjLQCiuEeNI` が既に public 化、22 分尺で「47 県全部見たい」構造を確立
- 個別動画 160 本ストック、再生数の伸びは安定
- 指名検索の現状確認は Phase 2 完了時点で実施

### Phase 4: 横展開 (×2.5)

**[仮説]** 国内 SEO 市場で頭打ちになった時点で、(a) 英語版 (AI 翻訳ベース) で海外検索流入、(b) 比較ツール・API でツール経由のオーガニック流入、(c) 隣接領域 (経済データ、不動産、人口動態) で新規キーワード獲得。

**根拠データ**:
- ペルソナ 4 (ビジネス・マーケター層) は既に定義済み
- 「Japan statistics by prefecture」英語クエリは underserved
- Phase 3 完了時点で国内市場が頭打ちかどうか実測してから判断

---

## やらないと決めること

| やらない | 理由 |
|---|---|
| TikTok 拡張 (Phase 3 まで) | 既に凍結中、アルゴリズム依存が強く ROI が読めない |
| 手動コンテンツ量産 (毎日記事) | 1 人運営で持続不能、月 1-2 本の高品質に集中 |
| B2B 営業・問い合わせ獲得 | PV 戦略と直交、月 3 件超えてから別途策定 (`docs/00_プロジェクト管理/02_収益化戦略.md` §戦略 4) |
| 多言語化 (Phase 3 まで) | 国内 SEO で頭打ちになるまで投資しない |
| 新機能の継続実装 (Phase 0-1 まで) | 既存ページの品質とインデックス回復に集中 |

---

## Phase 0: 漏れ止め (詳細)

**目標**: 25K → 38K PV/月 (×1.5)
**期間**: 2026-W21 〜 W28 (8 週間, ~2 ヶ月)
**完了判定週**: 2026-W28 (2026-07-13)

### 主要施策 (4 本)

| ID | 施策 | 期待効果 | 改善ログ | 現況 |
|---|---|---|---|---|
| P0-INDEX-01 | /ranking インデックス率改善 (43%→70%) | clicks +40% | [indexing.md INDEXING-AUTO-01](../05_改善ログ/indexing.md) | in-progress, due 2026-06-14 |
| P0-INDEX-02 | Coverage Drilldown 未登録解消 (1.6万→1.4k) | impressions +30% | [indexing.md INDEXING-DRILLDOWN-01](../05_改善ログ/indexing.md) | in-progress, due 2026-06-09 |
| P0-CTR-01 | /ranking 上位 100 URL の CTR 改修 (2.5%→3.5%) | clicks +25% | [gsc.md CTR-AUTO-01](../05_改善ログ/gsc.md) | in-progress, due 2026-06-21 |
| P0-CTR-02 | BLOG-CTR-02 (10 件改修 + 6 本新規) の効果確定 | clicks +5-10% | [gsc.md BLOG-CTR-02](../05_改善ログ/gsc.md) | pending, 2-4 週連続観測中 |

### 新規 Phase 0 専用 TODO

| ID | 施策 | 期待効果 | 担当 | due |
|---|---|---|---|---|
| P0-AREAS-01 | /areas/{prefCode} 47 ページの SEO 監査 + 内部リンク強化 | impressions +15% | claude | 2026-07-06 |
| P0-CITIES-DIAG | 市区町村ページの Phase 1 復活戦略設計 (sitemap / 内部リンク / 内容テンプレ) | Phase 1 投資判断材料 | claude | 2026-07-13 |

### 完了判定基準

Phase 0 完了 (effect/full) は以下すべてを満たすこと:

- [ ] /ranking indexed: 821 → 1,300+ (70%+ of sitemap 1,913)
- [ ] 週間 clicks: 797 → 1,200+ (+50%)
- [ ] CTR: 2.51% → 3.0%+
- [ ] 月間 PV: 25K → 38K+ (2026-07-13 を含む 4 週平均)
- [ ] 市区町村ページの Phase 1 復活戦略が文書化されている

未達の場合は Phase 0 を 4 週延長し、未達理由の仮説と検証コマンドを記載 (`.claude/rules/evidence-based-judgment.md` 準拠)。

### Phase 0 で並走する既存施策 (改善ログ参照)

- GA4-CLEAN-01 (in-progress, due 2026-06-07): GA4 Japan-only クリーン値で正確な PV 計測
- BLOG-CTR-01 (pending): manufacturing-aichi-dominance CTR 改訂効果確定
- CONTENT-NOTE-01 (pending, due 2026-05-24): note A-laborwage 5 本投稿

---

## Phase 1 以降の準備事項

### Phase 1 着手前に決めること (Phase 0 内で)

1. ~~**市区町村ページの品質テンプレート**~~ ✅ 2026-05-23 完了 → [`phase-1-plan.md`](./phase-1-plan.md) §2.3
2. ~~**sitemap 戦略**~~ ✅ 2026-05-23 完了 → [`phase-1-plan.md`](./phase-1-plan.md) §2.2 (S1=80, S2=500, S3=2,701 の段階導入)
3. ~~**指標拡張ロードマップ**~~ ✅ 2026-05-23 完了 → [`phase-1-plan.md`](./phase-1-plan.md) (1,994 → 5,000 を 4 Stage × 750 で実施)

### Phase 2 着手前に決めること (Phase 1 内で)

1. ~~**「公務員 × AI × 統計」コンテンツ戦略の具体テーマ 30 本**~~ ✅ 2026-05-24 完了 → [`phase-2-plan.md`](./phase-2-plan.md) (Series A-D で 30 本企画 + Stage 2-S1〜2-S4)
2. ~~**note 収益化フロー** (note ↔ stats47 ファネル定量化)~~ ✅ 2026-05-24 完了 → [`phase-2-plan.md`](./phase-2-plan.md) (Funnel A/B 設計 + UTM 規約)
3. ~~**被リンク獲得施策** (どこに何のリンクを置くか)~~ ✅ 2026-05-24 完了 → [`phase-2-plan.md`](./phase-2-plan.md) (linkable asset 6 本 + メディア配布 + HARO)

---

## 想定リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| Google アルゴリズム変動で /ranking が大幅順位下落 | -50% PV | Phase 0 の CTR 改修 + Phase 2 の権威化で耐性付与。コンテンツ多様化で単一カテゴリ依存を下げる |
| 市区町村ページ復活が「low quality」判定で site-wide ranking ダウン | -30% PV | Phase 1 着手前に品質テンプレ確定 + 段階導入 (まず 1,000 URL で 4 週観測) |
| YouTube アルゴリズム変動 (Phase 3) | brand 経路 -40% | YouTube 単独依存ではなく、Newsletter + SNS 並列構築 |
| 多言語版で site-wide のクロール予算分散 (Phase 4) | indexing 率低下 | 言語別 hreflang + 独立 sitemap + 段階リリース |
| 1 人運営の bandwidth 超過 | 全 Phase 遅延 | 月 1-2 本の高品質ルールを厳守、自動化 (CTR-AUTO-01 等) に投資 |

---

## 計測と振り返り

- **週次レビュー**: `docs/03_週次運用/週次レビュー/YYYY-Www.md` で Phase 進捗を毎週確認
- **月次振り返り**: 各月末に Phase 完了判定 (上記基準と照合)
- **真実源**: `docs/02_実装計画/improvement-backlog.md` の status 集約
- **自動 triage**: `.github/workflows/improvement-log-reminder-weekly.yml` (日曜 22:00 JST) で overdue 検知

## 関連ドキュメント

- 親方針: `CLAUDE.md` 行動原則 (12 軸)
- 年間ロードマップ (Q1-Q4): `docs/02_実装計画/01_実装ロードマップ.md`
- SEO TODO 一元化基盤: `docs/02_実装計画/seo-todo-unify-phase-1-3.md`
- ペルソナ Two-track 戦略: `docs/00_プロジェクト管理/04_ターゲットペルソナ.md`
- マーケティング戦略: `docs/00_プロジェクト管理/03_マーケティング戦略.md`
- 改善バックログ (TODO 真実源): `docs/02_実装計画/improvement-backlog.md`
- 実証ベース判定ルール: `.claude/rules/evidence-based-judgment.md`
