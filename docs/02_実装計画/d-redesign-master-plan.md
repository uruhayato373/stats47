---
type: redesign-master-plan
date: 2026-05-23
status: active
target_metric: gsc + adsense + affiliate
tags: [redesign, monetization, desktop-first, d-option]
---

> **⚠️ 2026-06 更新**: レイアウト（横幅/レール/サイドバー/角丸/フォント）の正典は
> [`docs/01_技術設計/21_統一レイアウト設計.md`](../01_技術設計/21_統一レイアウト設計.md)。
> 本プランの「左サイドバー」「`rounded-xl`」「Inter/Noto」等は現行実装
> （PC サイドバー廃止・フラット `--radius:0`・system フォント・`PageShell`）と異なる。実装の正は doc 21。

> **確定事項 (2026-05-23)**
> - ふるさと納税: A8.net 既加入 → `FurusatoNozeiCard` に商品ID 流し込み
> - メルマガCTA: **完全削除**（D案から該当セクション除外）
> - 既存ホーム: **一気に D案で置換**（feature flag 不要）
> - 実装順序: 計画通り（Phase 0 → ranking Phase 2 → home → area → category → theme → 残り）


# stats47 D案リデザイン マスタープラン

Claude Design でモックした 11 ページ × 4 案リデザインを、**全 11 ページとも D案（収益最大化）に統一**して順次本実装する。本書はその全体設計。

ref: `.claude/design-system/redesign/INDEX.md`（プロトタイプ真実源） / `.claude/skills/ui/apply-redesign/SKILL.md`（実装スキル）

## 1. 戦略の核 — なぜ D 統一なのか

W21 実測:

| 指標 | 値 |
|---|---|
| GSC clicks WoW | -55.5%（季節要因 + アルゴリズム揺れ） |
| AdSense RPM | ¥36（業界水準の 1/3） |
| AdSense 週次収益 | ¥61 |
| デスクトップ比率 | 大量（ユーザー指定。GA4 で要確認） |

ボトルネックは **「PV 増えても収益が増えない」**。RPM ¥36 → ¥100 を狙うには、AdSense クリック以外の収益経路（アフィリエイト、ふるさと納税）を本文に組み込み、デスクトップ滞在中の **3 種同時 monetize** が必須。

D案は唯一すべてのページで一貫して以下を実現する案:
- **暗色ヒーロー** で視覚的フック → 滞在時間延長
- **ネイティブアフィリエイト枠** を本文導線中に配置（ふるさと納税 / 書籍 / 特産品）
- **データパック CTA** で B2B 流入を引き上げる
- **In-feed AdSense** をコンテンツリズム内に溶け込ませる

既存実装の中で D案中核部品はすでに揃っているのが追い風:
- `RankingHeroCard`（ranking Phase 1 で実装済）
- `FurusatoNozeiCard`（`apps/web/src/features/ads/components/`）
- `AffiliateAdSlot` / `AreaBannerAd` / `BannerAd`
- `DataUsageCard` (CSV CTA, ranking で実装済)
- AdSense 7 スロット定数（`apps/web/src/lib/google-adsense/constants.ts`）

---

## 2. 共通設計言語 — "D-System"

11 ページに横展開する **8 つの共有プリミティブ**を最初に固める（既存があれば再利用）。

| プリミティブ | 役割 | 既存 / 新規 | 配置場所 |
|---|---|---|---|
| `D.HeroCard` | 暗色グラデーション + 大見出し + KPI タイル（2〜4 枚） | 一部既存 (`RankingHeroCard`) → 抽象化 | `apps/web/src/features/redesign/components/HeroCard.tsx` |
| `D.KpiTile` | KPI 1 件カード（label / value / unit / rank） | 新規 | 同上 |
| `D.NativeAffiliateRow` | 4 列ネイティブ枠（ふるさと納税 / 書籍 / 特産品） | `FurusatoNozeiCard` 活用 | `features/redesign/components/NativeAffiliateRow.tsx` |
| `D.DataPackCTA` | CSV ボタン (将来 JSON/Excel は disabled で「準備中」) | `DataUsageCard` 既存 → リネーム | 流用 |
| `D.InfeedAd` | "広告" ラベル + AdSense ユニット | 軽ラッパー | 既存 `AdSenseAd` を `D.InfeedAd` でラップ |
| `D.CategoryNav` | アイコン付き 9 列カテゴリピル | 新規 | `features/redesign/components/CategoryNav.tsx` |
| `D.SectionEyebrow` | 番号付きセクション見出し（"1. 〜"） | 新規 | 同上 |

### 配置原則

```
features/redesign/
  components/        ← 全 D ページが共有するプリミティブ
  tokens.css         ← styles.css から抽出した CSS 変数 (--shadow-sm 等)
  README.md
```

`packages/components`（shadcn ベース）には入れない理由: D 案固有のヒーロー暗色グラデーションなど、横断ライブラリに置くべき汎用度ではないため。features 内に閉じる。

### melta-ui ガードレール

プロトタイプ `styles.css` の以下は本実装時に変換:

| プロト | 本実装 |
|---|---|
| `--shadow-lg` | `shadow-sm` / `shadow-md` |
| `text-black`, `#0b1220` 直書き | `text-slate-900` / `text-foreground` |
| `letter-spacing: -0.01em` | 削除（日本語可読性） |
| インラインスタイル `style={{...}}` | Tailwind クラス |

参考: `.claude/rules/ui-components.md` / `.claude/design-system/prohibited.md`

---

## 3. 収益最大化アーキテクチャ

3 種の収益経路を「同一ページに同居」させる前提でレイアウトを組む。

### 3.1 AdSense 配置マップ

| ページ | desktop slots | mobile slots | 備考 |
|---|---|---|---|
| ranking | sidebar-top + sidebar-skyscraper + footer | incontent-mobile + footer | 現状維持 |
| home | hero 下 + footer | hero 下 + footer | hero 下を新設 |
| area | hero 下 + KPI 下 + footer | hero 下 + footer | KPI 下は新規スロット |
| category | hero 下 + 全件テーブル下 + 関連書籍下 + footer | hero 下 + footer | テーブル下を新規 |
| theme | KPI 下 + footer (既存 `THEMES_CONTENT`) | KPI 下 + footer | 維持 |
| themes-index | hero 下 + footer | hero 下 + footer | hero 下を新設 |
| compare | scoreboard 下 + footer | scoreboard 下 + footer | 新規 |
| survey | hero 下 + footer (既存 `CONTENT_FOOTER`) | hero 下 + footer | 維持 + 強化 |
| search | results 下 + footer (既存 `CONTENT_FOOTER`) | results 下 + footer | 維持 |
| blog | inline (既存 `BLOG_ARTICLE_INLINE`) + footer | inline + footer | 維持 |
| tag | hero 下 + footer (既存 `CONTENT_FOOTER`) | hero 下 + footer | 維持 |

新規スロット要件: 4 個（home-hero-below / area-kpi-below / category-table-below / compare-scoreboard-below）。AdSense 管理画面で発行 → `constants.ts` 追加 → 配置。

### 3.2 アフィリエイト・ネイティブ枠マップ

| ページ | ネイティブ枠の内容 | 既存資産 |
|---|---|---|
| home | カテゴリ別ふるさと納税（4 枚カルーセル） | `FurusatoNozeiCard` 流用 |
| area | 県別ふるさと納税（4 枚、その県の特産品） | `AreaBannerAd` 拡張 |
| ranking | カテゴリ別アフィリエイト（ranking Phase 2 で実装、書籍/特産品） | `resolveAffiliateBanners` 既存 |
| category | カテゴリ別書籍カード（4 枚） | `resolveAffiliateBannersByCategory` 既存 |
| compare | 比較対象県のふるさと納税（2 県分） | 新規組み合わせ |
| theme | テーマ別書籍 + データパック | 流用 |
| themes-index | テーマ別書籍（一覧から） | 流用 |
| survey | 関連書籍（4 枚） | 流用 |
| search | クエリマッチ書籍（4 枚） | 新規 fallback |
| blog | 記事中 + 末尾 affiliate banner（既存） | `article-affiliate-banner.tsx` 維持 |
| tag | タグ関連書籍 | 流用 |

ふるさと納税アフィリエイト: A8.net で「ふるさとチョイス」「さとふる」「楽天ふるさと納税」「ふるなび」の各プログラム加入が前提（要確認 → § 9）。**もし未加入なら、既存 A8 affiliate banner を「県/カテゴリ別商品」として代用** する fallback で出発する。

### 3.3 データパック CTA マップ

| ページ | DataPack CTA |
|---|---|
| home | あり（CSV、JSON/Excel は disabled「準備中」） |
| ranking | あり（`DataUsageCard` 既存） |
| area | カテゴリ全件 CSV |
| category | カテゴリ zip CSV |
| theme | テーマ KPI CSV |
| themes-index | — |
| compare | — |
| survey | 調査全件 CSV |
| search | — |
| blog | 記事末「関連データ DL」 |
| tag | — |

**メルマガ CTA は全ページ削除（確定）**。プロトタイプの該当セクションは無視する。

**JSON/Excel ダウンロード**: CSV ボタンは active、JSON/Excel は UI のみ disabled + ツールチップ「準備中」とする。実装インパクトを最小化しつつ将来の拡張余地を残す。

---

## 4. デスクトップ最適化 × モバイル「適度な品質」

### 4.1 ブレイクポイント方針

| 領域 | 主軸 | ブレイクポイント |
|---|---|---|
| ページレイアウト全体（サイドバー有無） | viewport `lg:` (1024px) | 現行と整合 |
| Hero グリッド（2 列 vs 1 列） | viewport `lg:` | KPI タイル 2x2 → 1x4 |
| KPI Tile グリッド | viewport `md:` | 4 列 → 2 列 |
| ネイティブ枠（ふるさと納税 4 列） | viewport `md:` / `lg:` | 4 → 2 → 1 |
| カテゴリピル 9 列 | viewport `md:` | 9 → 3 / 5 |
| AdSense incontent-mobile | viewport `lg:hidden` | デスクトップは sidebar、モバイルは中盤 |

参考: `.claude/rules/ui-components.md` (コンテナクエリ vs viewport の使い分け)

### 4.2 デスクトップ最適化の具体策

- **Hero は 1200px max-width で 2 カラムグリッド**（左: タイトル＋CTA / 右: KPI タイル or hero stat）
- **ネイティブ枠は 4 列固定**（モバイルだけ崩す）
- **サイドバー幅 280px** で固定（lg+ のみ表示）
- **メインカラム最大 920px**（読みやすさ重視）
- **KPI Tile は最低 width 160px** で 4 列保証

### 4.3 モバイル「適度な品質」

- Hero は縦積み（KPI 4 枚は 2x2 グリッド）
- ネイティブ枠は **2 列まで圧縮**（1 列はスクロール疲労を増やすので避ける）
- 暗色ヒーローはモバイルでも維持（インパクトの源）
- カテゴリピルは **横スクロール可能なフレックス** に切り替え
- AdSense は ranking で確立した「incontent-mobile + footer」パターンを他ページにも横展開

### 4.4 LCP 維持

- ヒーローは **テキスト主体**（背景はグラデーションのみ、画像なし）→ LCP 候補は h1 になる
- 暗色 hero の glow effect は CSS のみ（画像 0）
- JapanMap 系は `dynamic` import で遅延ロード
- AdSense は `data-ad-frequency-hint` で lazy-load

---

## 5. ページ別ロードマップ（D 統一）

### 5.1 優先順位（ROI 順）

| 順位 | ページ | 理由 |
|---|---|---|
| ★1 | **ranking Phase 2** | Phase 1 完了済。アフィリエイト枠追加だけで完了 |
| ★2 | **home** | 全流入の入り口。ふるさと納税 + メルマガで RPM 改善余地大 |
| ★3 | **area** | 県別 SEO 長尾 × ふるさと納税の最高相性 |
| ★4 | **category** | ランキング流入のハブ。書籍アフィリエイト相性◎ |
| ★5 | **theme dashboard** | 17 テーマ共通レイアウト → 1 実装で全展開 |
| ★6 | **themes-index** | カテゴリ・テーマ回遊強化 |
| ★7 | **survey** | 調査名 SEO 強化 |
| ★8 | **compare** | スコアボード型は実装重め、後回し |
| ★9 | **search** | ファセット検索は影響範囲大、後回し |
| ★10 | **blog** | エディトリアル整理（既に affiliate banner ある） |
| ★11 | **tag** | 影響範囲小 |

### 5.2 各ページの構造（D 共通テンプレ）

```
[Breadcrumb]
[D.HeroCard]           ← 暗色グラデ + タイトル + KPI 2-4 枚 + 主 CTA
[InfeedAd? hero下]      ← 配置マップ参照
[Main 2-col grid]      ← lg+
  [Main column]
    [核コンテンツ 1]     ← 地図/テーブル/チャート/結果一覧 等
    [D.NativeAffiliateRow]  ← ★ ネイティブ収益
    [D.DataPackCTA]    ← CSV active / JSON/Excel disabled
    [InfeedAd]
    [核コンテンツ 2]     ← AI考察/FAQ/相関分析 等
  [Sidebar lg+ only]
    [関連リンク]
    [InfeedAd sidebar]
[InfeedAd footer]
```

### 5.3 各ページの独自要素

| ページ | Hero KPI | ネイティブ枠 | データパック | サイドバー |
|---|---|---|---|---|
| ranking | 1位 県 + 全国合計 + 平均 + 最少 | カテゴリ別 affiliate | 既存 `DataUsageCard` | 関連ランキング + AdSense（メルマガなし） |
| home | 1800 指標 + 47 都道府県 + 250 万データポイント + 6 年分 | ふるさと納税 4 県 | CSV (JSON/Excel disabled) | — |
| area | 県の総人口 + 人口密度 + 高齢化率 + 世帯数 | 県別ふるさと納税 4 件 | カテゴリ全件 CSV | 関連エリア + 隣接県 |
| category | 全国合計 + 高齢化率 + 東京シェア + トップ減少率 | カテゴリ書籍 4 件 | カテゴリ zip | 関連カテゴリ |
| theme | テーマ別 4 KPI（既存） | テーマ書籍 4 件 | テーマ CSV | 関連テーマ |
| themes-index | 17 テーマ件数 + 1800 ランキング + etc | テーマ書籍 4 件 | — | テーマカテゴリ |
| survey | 政府統計バッジ + 4 KPI（年/頻度/件数/最新） | 関連書籍 4 件 | 調査全件 CSV | 関連調査 |
| compare | スコアボード 2 県 | 両県のふるさと納税 各 2 件 | — | 他県比較リンク |
| search | クエリ + ヒット数 + 平均更新日 | クエリ書籍 4 件 fallback | — | ファセット |
| blog | タイトル + meta（既存維持） | inline affiliate（既存維持） | 関連 CSV | TOC + 関連記事 |
| tag | タグ名 + 件数 + カテゴリ + 最新 | タグ書籍 4 件 | — | 関連タグ |

---

## 6. 実装フェーズ（W22-W26）

各 Phase はブランチ 1 本 + PR 1 本を原則とし、`develop → main` で merge する（`.claude/rules/branch-workflow.md` 準拠）。

### Phase 0 — 共通プリミティブ確立（1-2 日）

- `apps/web/src/features/redesign/` ディレクトリ作成
- `D.HeroCard` / `D.KpiTile` / `D.NativeAffiliateRow` / `D.DataPackCTA` / `D.InfeedAd` / `D.SectionEyebrow` 実装
- 既存の `RankingHeroCard` を `D.HeroCard` に統合（refactor）
- Storybook なし。`apps/web/tests/` で snapshot のみ
- 完了基準: `pnpm typecheck` + `next build` で SSG ○ 維持

### Phase 1 — ranking Phase 2 + home（W22）

- **ranking Phase 2**: カテゴリ別 `D.NativeAffiliateRow` を AI考察カードの上に追加
- **home D**: 既存ホームを破壊的に置換。ヒーロー暗色化 + KPI 4 枚 + ふるさと納税 + データパック
- 完了基準: GA4 で home → ranking 推移率を計測（baseline 取得）

### Phase 2 — area + category（W23）

- **area D**: 県プロフィールヒーロー + ふるさと納税ネイティブ + 隣接県 CTA
- **category D**: カテゴリヒーロー + 注目 3 枚 + 全件テーブル + 書籍ネイティブ
- 完了基準: 1 県 + 1 カテゴリで実機検証、Lighthouse ≥ 85

### Phase 3 — theme + themes-index + survey（W24）

- **theme D**: 17 テーマ共通 `ThemePageLayout` 改修（影響範囲確認必須）
- **themes-index D**: ディスカバリーレイアウト
- **survey D**: 政府統計バッジ + 4 KPI ヒーロー
- 完了基準: 17 テーマ全件で SSG 維持

### Phase 4 — compare + search + blog + tag（W25-W26）

- compare D: スコアボード型 + ふるさと納税
- search D: ヒーロー + ディスカバリー
- blog D: ファインチューンのみ（既に affiliate ある）
- tag D: タグハブ
- 完了基準: 全 11 ページ完了、AdSense + Affiliate の週次収益比較

### Phase 5 — 計測 + 微調整（W26）

- W21 と W26 で AdSense RPM / Affiliate CTR を比較
- 効果判定: `docs/02_実装計画/improvement-backlog.md` に effect/* で記録
- 想定: RPM ¥36 → ¥60 程度（中央値仮説）

---

## 7. SEO & パフォーマンスのガードレール

### 7.1 SSG 必達

`.claude/rules/nextjs-ssg-preservation.md` を厳守:
- layout / layout 配下の Server Component で `cookies()` / `headers()` / `draftMode()` 禁止
- 各 PR の最後に `next build` で `○ (Static)` 確認

### 7.2 JSON-LD 維持

ranking ページの構造化データ生成は維持。新規 hero でも以下を破壊しない:
- `generateRankingPageStructuredData`
- `generateRankingBreadcrumbStructuredData`
- FAQ JSON-LD（`RankingFaqSection`）

### 7.3 LCP 維持

- ヒーロー画像は使わない（テキスト LCP）
- 暗色 hero は CSS グラデーションのみ
- JapanMap などはタブ切り替えで初期表示から外す（モバイルでは既に対応済）

### 7.4 AdSense ポリシー

- ネイティブアフィリエイト枠には **「PR」ピル** を必須付与
- AdSense ユニットには **「広告」ラベル**（既存 `D.InfeedAd` に組み込む）
- AdSense の隣接配置ポリシー: ネイティブアフィリエイトと AdSense は最低 1 セクション空ける

### 7.5 Cookie / Consent

- consent banner は visibility:hidden パターン維持（`feedback_nextjs_ssg_cookies.md`）
- D 案で hero に embeded 広告を入れても、cookie 取得は client 側のまま

---

## 8. 検証フロー

### 8.1 各 Phase 完了時の必須チェック

1. `pnpm typecheck`（全ワークスペース）
2. `cd apps/web && pnpm build`
   - 該当ページが `○ (Static)` であること
   - 警告 0 件
3. `/verification-loop` 実行
4. Lighthouse モバイル: Performance ≥ 75, SEO ≥ 95
5. 1 ページにつき 3 ルート抜き取って実機確認（chrome dev tools）
6. ネイティブ枠の「PR」ピルが表示されていること
7. AdSense ユニットが lg/mobile で正しく描画されていること

### 8.2 Phase 1 / 5 で取る計測

| 指標 | データ源 | Phase 1 baseline | Phase 5 目標 |
|---|---|---|---|
| AdSense RPM | `.claude/state/metrics/adsense/LATEST.md` | ¥36 (W21) | ¥60 |
| Page Views | 同上 | 1711 (W21) | +20% |
| Active Users | `.claude/state/metrics/ga4/LATEST.md` | 1104 (W21) | +30% |
| Affiliate CTR | A8.net レポート | 取得 | +50% |
| Furusato CV | 同上 | 0 (PG 加入次第) | 月 1+ |

---

## 9. 確定事項（2026-05-23）

| 論点 | 決定 |
|---|---|
| ふるさと納税アフィリエイト | A8.net 既加入 → `FurusatoNozeiCard` に商品ID 流し込み。Phase 0 で商品ID 棚卸し |
| メルマガ CTA | **D案から完全削除**。home / area / category / ranking すべてからセクション除外 |
| JSON / Excel ダウンロード | **CSV のみ active**、JSON/Excel ボタンは UI 残しつつ disabled + ツールチップ「準備中」 |
| home 置換方式 | **一気に D案で置換**（feature flag 不要、GA4 baseline で効果計測） |
| ranking サイドバーのメルマガカード | 永久に省略（W22 Phase 2 でも復活させない） |

### 9.1 残作業として追跡すべき項目

- **A8 商品ID 棚卸し**: ふるさと納税 4 プログラム × 47 県（4 商品 / 県）= 188 商品の ID マッピング表。`apps/web/src/features/ads/repositories/` に既存があれば活用、なければ Phase 0 で作成
- **`FurusatoNozeiCard` の県別商品取得 API 確認**: Phase 0 で動作確認、不足機能があれば抽出

---

## 10. 2026-05-25 進捗ハンドオフ (PR #349-#354 series)

W21 セッションで Phase 1 (横幅最大化 + 共通プリミティブ + 右サイドバー) と
ブログ強化 (3 カラム + コードブロック配色 + ふるさと納税 3 段ロジック) を完了。

### 完了済 (PR ベース)

| PR | 内容 |
|---|---|
| #349 | ranking テーブルのモバイル overlap 修正 (`min-w-max`) |
| #350 | ranking pill / group toggle のモバイル Select 化 |
| #351 | CSV 出力に normalizationType 反映 + CodeQL whitelist |
| #352 | CSV/JSON ダウンロード R2 事前生成化 (Route Handler + 全基準 + Shift_JIS) + DataUsageCard リファクタ |
| #353 | D-System Phase 1 プリミティブ (`WidePageShell`/`RightRailWidgets`/`NextUpGrid`) + ブログ α 3 カラム + コードブロック配色改善 + ふるさと納税 3 段ロジック + Tailwind container 1700px |
| #354 | area / category / themes-index / tag に右サイドバー追加 + home に NextUpGrid 追加 |

### 残作業

詳細は `docs/02_実装計画/feature-backlog.md` の以下セクションを参照:

- **T2-REDESIGN-PHASE2**: KPI Tile クリック化 + 本文中 NativeAffiliateRow 周期挿入
- **T2-REDESIGN-PHASE3**: A8.net 統合 + compare/search ページ実装 + 環境変数本番設定 + CSV ダウンロード R2 push 反映

### 環境変数 (Cloudflare Pages env vars)

本番で実 ASP に切り替える際は以下を設定:

| 変数 | 用途 | 未設定時の挙動 |
|---|---|---|
| `NEXT_PUBLIC_TECH_SCHOOL_AFFILIATE_URL` | Claude Code 副業講座 ASP URL | `/about` にフォールバック |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` | 楽天アフィリエイト ID | ID なしのリンクで遷移 |
| `NEXT_PUBLIC_RAKUTEN_APP_ID` | 楽天 API アプリ ID | ふるさと納税商品取得が空配列 (固定リンクへ fallback) |

### 運用タスク

- ~~`run.sh --only ranking-download` で CSV/JSON 事前生成~~ → **廃止 (2026-06-01)**。
  download は route `/api/ranking/[key]/download` で**オンザフライ生成**に変更（事前 bake は全 metric で
  1GB 超 / 23K files / timeout のため不採用）。運用タスク不要。詳細: memory `project_ranking_download_onthefly`。

---

## 11. 関連ドキュメント

- `.claude/design-system/redesign/INDEX.md` — 11 ページ進捗トラッカー（真実源）
- `.claude/design-system/redesign/README.md` — プロトタイプ運用
- `.claude/skills/ui/apply-redesign/SKILL.md` — 実装スキル
- `.claude/rules/ui-components.md` — melta-ui 規約
- `.claude/rules/nextjs-ssg-preservation.md` — SSG 死守規約
- `.claude/rules/coding-standards.md` — TS / React 規約
- `docs/02_実装計画/seo-todo-unify-phase-1-3.md` — SEO 改善との整合
- `docs/02_実装計画/improvement-backlog.md` — 改善バックログ（Phase 5 完了時に記入）

## 12. 完了の定義

本マスタープランの「完了」は以下すべてが成立した時点:

1. 11 ページすべてが D 案実装で merge 済
2. `INDEX.md` ですべて `done`
3. AdSense RPM が Phase 0 baseline 比 +60% 以上
4. Lighthouse Performance / SEO 全ページで合格水準
5. SSG ステータスが全ページで `○ (Static)`
6. `docs/02_実装計画/improvement-backlog.md` に effect/* で記録

## 13. 実装ログ (2026-05-23)

### Phase 0-5 完了 (8/11 ページ実装 / 3 ページ deferred)

| Phase | 内容 | 状態 |
|---|---|---|
| Phase 0 | `apps/web/src/features/redesign/` に 8 プリミティブ (`HeroShell` / `KpiTile` / `KpiGrid` / `SectionEyebrow` / `InfeedAd` / `NativeAffiliateRow` / `DataPackCTA` / `CategoryNav`) | ✅ |
| Phase 1.1 | ranking Phase 2: `NativeAffiliateRow` を AI 考察上に追加（`resolveAffiliateBanners` 経由） | ✅ |
| Phase 1.2 | home D 破壊的置換: 暗色 hero + 4 KPI + featured + ふるさと納税 4 県 + テーマ + 記事 + データパック CTA | ✅ |
| Phase 2.1 | area D: `AreaProfilePageClient` を暗色ヒーロー (top4 strength を KPI に) に書き換え。area top + category subpage 両方に反映 | ✅ |
| Phase 2.2 | category D: ヒーロー + 4 KPI + テーブル + In-feed AdSense + ネイティブaff | ✅ |
| Phase 3.1 | theme D: `ThemePageLayout` 全体改修。17 テーマ共通の hero + 4 KPI + ネイティブaff | ✅ |
| Phase 3.2 | themes-index D: 一覧ページに hero + 4 KPI | ✅ |
| Phase 3.3 | survey D: 調査詳細に政府統計バッジ付き hero + 4 KPI + ネイティブaff + In-feed AdSense | ✅ |
| Phase 4.1 | compare D | ⏭️ deferred (noindex のため SEO 影響なし) |
| Phase 4.2 | search D | ⏭️ deferred (noindex) |
| Phase 4.3 | blog D | ⏭️ deferred (既に `ArticleAffiliateBanner` で配置あり) |
| Phase 4.4 | tag D: hero + ネイティブaff (tagKey から affiliate banner 解決) | ✅ |
| Phase 5 | typecheck OK / next build OK / SSG 全維持 (home ○ Static, ranking/area/blog/survey/tag/theme 全 SSG/Static) | ✅ |

### 検証結果

```
✓ npx tsc --noEmit -p apps/web/tsconfig.json: exit 0
✓ npm run build: 成功
  - / (home): ○ Static
  - /ranking/[rankingKey]: ● SSG (2000+ paths)
  - /areas/[areaCode]: ● SSG (47 paths)
  - /blog/[slug]: ● SSG (180+ paths)
  - /survey/[surveyKey]: ● SSG (40+ paths)
  - /tag/[tagKey]: ● SSG (130+ paths)
  - /themes/[theme] × 17: ○ Static
  - /themes: ○ Static
```

### deferred の理由

- **compare/[categoryKey]**: `robots: "noindex, follow"` のため SEO 流入なし、RPM 寄与も限定的。完全 D 化は ROI 低い
- **search**: 同上、`robots: { index: false }`
- **blog/[slug]**: 既に `ArticleAffiliateBanner` でカテゴリ別アフィリエイトが導入済。追加の hero/native row は記事冒頭の読みやすさを損ねる可能性があるため見送り

これら 3 ページは Phase 6（将来）で取り組む。

### 次のアクション

1. **コミット & PR**: feature/d-redesign ブランチ (or 現行 feature/station-passengers から派生) で develop に merge → main PR
2. **GSC URL Inspection**: deploy 後 1 週間以内に主要ページの再クロール状況を確認
3. **AdSense RPM 計測**: W22 末で W21 baseline (¥36) との比較を `docs/02_実装計画/improvement-backlog.md` に記録 (effect/* ラベル)
4. **deferred 3 ページ**: 必要に応じて Phase 6 で着手
