---
type: redesign-tracker
date: 2026-05-25
status: active
source_bundle: stats47-ranking-handoff (13).zip — 2026-05-22 20:31 export
master_plan: docs/02_実装計画/d-redesign-master-plan.md
last_updated: 2026-05-25 (PR #349-#354 series)
---

# stats47 リデザイン進捗トラッカー

> **⚠️ 2026-06 更新**: レイアウト（横幅/レール/サイドバー/角丸/フォント）の正典は
> [`docs/01_技術設計/21_統一レイアウト設計.md`](../../../docs/01_技術設計/21_統一レイアウト設計.md) に移行。
> 本トラッカーと配下の HTML モックアップ（サイドバー前提・`rounded-xl`・Inter/Noto 等）は
> **当時の探索資産（履歴）**であり、現行実装（PC サイドバー廃止・フラット `--radius:0`・system フォント・`PageShell`）とは異なる。実装の正は doc 21。

> **全体設計**: [`docs/02_実装計画/d-redesign-master-plan.md`](../../../docs/02_実装計画/d-redesign-master-plan.md)
> 11 ページとも D案（収益最大化）に統一、Phase 0 → ranking Phase 2 → home → area → category → theme → 残りの順で実装する。

Claude Design (claude.ai/design) でモックアップした **11 ページ × 各 4 案** のリデザインを、`/ranking` ページから順次本実装していくための真実源。

- 案の比較・採用・実装は **`/apply-redesign <page>`** スキルで行う。
- ステータスを更新するのは `apply-redesign` スキルのみ。手動編集も可。
- プロトタイプ本体は `project/` 配下（HTML/CSS/JS）。`<Page> Redesign.html` をブラウザで開くと 4 案を並べて確認できる。

## ステータス凡例

| status | 意味 |
|---|---|
| `untouched` | 未着手 |
| `reviewed` | 4 案レビュー済・推奨提示済（採用未確定） |
| `chosen` | 採用案が確定（実装待ち） |
| `in_progress` | 実装中 |
| `done` | 本実装・デプロイ完了 |

## 進捗表

**全 11 ページとも D 案で確定（2026-05-23 マスタープラン）**。

| page | 対象ルート | プロトタイプ | 採用案 | status | PR |
|---|---|---|---|---|---|
| ranking | `/ranking/[rankingKey]` | `Ranking Page Redesign.html` | **D**（Phase1 + Phase2 ネイティブaff） + 横幅最大化 | `done` | PR #349-#352 |
| home | `/` | `Home Page Redesign.html` | **D** (破壊的置換) + NextUpGrid + 横幅最大化 | `done` | PR #353-#354 |
| area | `/areas/[areaCode]/[categoryKey]` | `Area Page Redesign.html` | **D** (AreaProfilePageClient ヒーロー化) + 右サイドバー (その県のふるさと納税) | `done` | PR #354 |
| category | `/category/[categoryKey]` | `Category Page Redesign.html` | **D** + ネイティブaff + サイドバー 256→360 + TechSchool | `done` | PR #354 |
| compare | `/compare/[categoryKey]` | `Compare Page Redesign.html` | **D** (noindex のためスキップ) | `deferred` | — |
| theme | `/themes/[theme]` | `Theme Dashboard Redesign.html` | **D** (ThemePageLayout 共通化) | `done` (local) | — |
| themes-index | `/themes` | `Themes Index Redesign.html` | **D** + 右サイドバー追加 | `done` | PR #354 |
| survey | `/survey/[surveyKey]` | `Survey Page Redesign.html` | **D** + ネイティブaff | `done` (local) | — |
| search | `/search` | `Search Page Redesign.html` | **D** (noindex のためスキップ) | `deferred` | — |
| blog | `/blog/[slug]` | `Blog Page Redesign.html` | **α 3 カラム** (TOC + 本文 + 関連) + コードブロック配色改善 + ふるさと納税 3 段ロジック | `done` | PR #353 |
| tag | `/tag/[tagKey]` | `Tag Page Redesign.html` | **D** + ネイティブaff + 右サイドバー追加 | `done` | PR #354 |

実装ログ:
- 2026-05-23: Phase 0 共通プリミティブ (`apps/web/src/features/redesign/`) 作成
- 2026-05-23: Phase 1-4 主要 8 ページ実装 (ranking / home / area / category / theme / themes-index / survey / tag)
- 2026-05-23: Phase 5 検証完了 (typecheck OK / next build OK / SSG 全維持: home ○ Static / ranking ● SSG / area ● SSG / theme ○ Static × 17 / survey ● SSG / tag ● SSG)
- 2026-05-25 (PR #349-#352): ranking UX 修正 (テーブル overlap / pill モバイル Select 化 / CSV norm 反映 / R2 事前生成化)
- 2026-05-25 (PR #353): D-System Phase 1 プリミティブ追加 (`WidePageShell` / `RightRailWidgets` / `NextUpGrid`) + blog/[slug] α 3 カラム化 + コードブロック配色改善 + ふるさと納税 3 段ロジック + Tailwind container 1700px 拡張 (全 50+ ページ自動適用)
- 2026-05-25 (PR #354): D-System Phase 1 後半 — area / category / themes-index / tag に右サイドバー追加 + home に NextUpGrid 追加
- compare / search は noindex pages → 引き続き `deferred`

## 各ページの 4 案サマリ

4 案はおおむね **A=低リスク整理 / B=構造強化 / C=パワーユーザー最適化 / D=収益最大化** の方向で振られている。

### ranking — ランキング詳細ページ
- **A** 統合ツールバー（整理改善）— 全操作を 1 本のツールバーに集約。最も低リスク。
- **B** メトリック・カードタブ（Bold）— 単位切替を 3 枚の大カードに昇格。
- **C** スティッキー・コントロールレール（PC 最適化）— 左に縦型固定操作パネル。
- **D** ヒーロー・メトリック＋ネイティブ収益 — 暗色ヒーロー＋本文中に収益枠。最も攻めた案。

### home — トップページ
- **A** 整理改善（低リスク）— h1 拡大、注目ランキングのカード化、3 切り口の整理。
- **B** Interactive Map Hero — 大きな日本地図＋検索を入り口に。
- **C** Editorial / Magazine — 「今日のランキング」大型エディトリアルカード。
- **D** Revenue-Optimized — 暗色ヒーロー＋ふるさと納税＋in-feed AdSense。

### area — エリア × カテゴリページ
- **A** 整理改善（現行構造踏襲）— h1 拡大、ツールバー化、1→2 カラム化。
- **B** エリア・プロファイル・ハブ — 都道府県プロファイルヒーロー＋大ナビ。
- **C** Compare-First — ページ全体を地域 H2H 分析に最適化。
- **D** ストーリー型＋ふるさと納税ネイティブ収益。

### category — カテゴリページ
- **A** 整理改善（現行構造踏襲）— h1 拡大、テーブルにツールバー追加。
- **B** Featured ヒーロー＋強化テーブル — リーダーボード風大カード＋スパークライン列。
- **C** ナビゲーション・ハブ — 左ナビハブで横断回遊を強化。
- **D** ストーリー型＋ネイティブ収益。

### compare — 比較ページ
- **A** 整理改善（低リスク）— セレクタ大型カード化、ダブルバー＋差分%。
- **B** スコアボード・ヒーロー — スポーツのスコアボード風。
- **C** マトリックス・テーブル（Power-user）。
- **D** Story Editorial＋ふるさと納税。

### theme — テーマダッシュボード
- **A** 整理改善（現行構造踏襲）— 指標タブのピル化、ツールバー統合。
- **B** KPI ヒーロー（Bold）— 12 枚の KPI カードに置換。
- **C** マップ中心＋指標サイドナビ（Power-user）。
- **D** ストーリー型＋ネイティブ収益。

### themes-index — テーマ一覧ページ
- **A** 整理改善（低リスク）— h1 拡大、フィルタピル、カード強化。
- **B** 注目＋カテゴリグルーピング。
- **C** マトリックス・アトラス — 全テーマを 5 列グリッドで俯瞰。
- **D** Discovery＋ネイティブ収益。

### survey — 調査名ページ
- **A** 整理改善（低リスク）— メタ情報整理、TileMap 付きカード強化。
- **B** 調査プロファイル・ヒーロー — 政府統計バッジ＋概要 4 KPI。
- **C** 「調査を読み解く」エディトリアル — 横スクロール調査タイムライン。
- **D** データジャーナリスト向け＋書籍ネイティブ。

### search — 検索ページ
- **A** 整理改善（低リスク）— 大型ピル検索ボックス、結果カード強化。
- **B** 大型ヒーロー＋ディスカバリー — クエリ空時の発見体験を最適化。
- **C** Power-Search — 左カラムにファセット検索を完全展開。
- **D** Discovery＋ネイティブ収益。

### blog — ブログ記事ページ
- **A** エディトリアル整理（低リスク）— タイトル拡大、メタ整理、サイドバー整理。
- **B** TOC＋デュアルサイドバー — 目次・読書進捗・両サイドバー。
- **C** マガジン・スタイル — フルブリードヒーロー、drop cap。
- **D** データストーリー＋ネイティブ収益。

### tag — タグページ
- **A** 整理改善（低リスク）— h1 拡大、タグ統計バナー、記事カード強化。
- **B** タグハブ（Discovery）— 大型ヒーロー＋関連タグカルーセル。
- **C** タイムライン・アーカイブ — 年月グルーピング。
- **D** Discovery＋ネイティブ収益。
