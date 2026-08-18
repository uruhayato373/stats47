---
type: theme-deepdive
theme: population-dynamics
date: 2026-07-13
status: proposal
---

# テーマ deep-dive 監査: population-dynamics（人口動態）

## 現状

ThemeCatalog は 11 指標 (primary 1 / secondary 9 / context 1)、chart 10 件 (line 4 / composition 1 /
pyramid 1 / mixed 1 / markdown 3)。primary は `crude-birth-rate` (粗出生率) のみで、`selection`
記入済みは 0/11 (`selectionMissingCount: 10` は primary/secondary 9 件分。context 1 件は対象外の
カウント方式)。10 チャートのうち `rankingLink` が設定されているのは `ratio-65-plus` と
`total-population` の 2 件のみで、残り 8 件は null。`relatedArticleTagKeys` はカタログに未設定
(型としては `ThemeCatalog` に存在するがこのテーマでは使われていない)。

直近レビュー (2026-07-11, `reviewGate: proposal-ready`) は「人口増減率で結果を見る→自然/社会増減で
要因を分ける→出生/死亡・転入/転出で内訳→年齢構成で構造」の4段階読み順を提案し、`population-growth-rate`
の primary 追加、`natural-increase-rate` の primary 昇格、`social-increase-rate` の鮮度解決後 primary
昇格を提言している。ユーザー承認待ちで未実装 (portfolio.json `lifecycleStatus: improve` はこのレビュー
を根拠に既に反映済み)。

## 問題

1. **primary が「結果」ではなく「内訳の一部」**: `crude-birth-rate` (粗出生率) は自然増減の内訳指標で、
   テーマの主問「人口がなぜ増減しているか」への直接回答になっていない。`population-growth-rate` (人口
   増減率、R2 実在確認済み・2024年・47県) が未登録のまま。
2. **チャートの内部導線が薄い**: 10 チャートのうち `rankingLink` 設定は 2/10 のみ。8 チャートは対応する
   `/ranking/<key>` への誘導がなく、読者が「この指標をもっと詳しく見る」動線を持たない。
3. **`social-increase-rate` の鮮度**: R2 実測で最新年は **2019年** (2018-2019の2年分のみ)。同テーマ内の
   `natural-increase-rate` (2024年まで) と並べると読者が誤って同年比較する可能性がある。
4. **GA4 pageViews が W25 (166pv) をピークに W28 (63pv) まで反落**: サイト全体の同期間 GA4 pageViews は
   W24 (4,511) → W28 (6,033) と +34% 増加しており、テーマ単体の反落はサイト全体トレンドと逆方向。
   snapshot にページ別×流入元 (source/medium) のクロス breakdown が無いため、**原因は特定不能**
   (下記「GA4 -80pv の分析結果」参照)。
5. **GSC は measured-low**: 56d 窓で impressions 100 (最低標本 200 未満)、clicks 2。検索需要はまだ
   ノイズ域で、CTR/順位などの比率値は解釈できない。

## 仮説

**[仮説]** W20-W25 の急増 (1pv→166pv) は SNS 投稿や外部リンクなど一過性の流入源による可能性がある。
W26 以降の反落はその一過性流入の枯渇であり、テーマ品質の劣化ではない可能性が高い。
**検証コマンド**: GA4 API で `/themes/population-dynamics` の `sessionSource`/`sessionMedium` 別
pageViews を W20-W28 で取得 (現行 snapshot には含まれないため `ga4-analyst` への追加 fetch 依頼が必要)。
**検証期日**: 次回月次監査 (2026-08 頭)。
**期日後の判定**: source/medium 内訳で特定の流入元 (organic search 以外) が W20-W25 に集中し W26 以降
消失していれば仮説支持 (一過性流入)。organic search が主要流入元で反落も organic 起因なら仮説棄却し、
検索順位・インデックス状態を GSC URL Inspection で個別検証する。

## 判定

**improve を維持**（既存 portfolio.json の判定を追認）。merge/split/rename/retire に足る根拠はない
(GSC が measured-low で 56d windowDays 条件は満たすが、retire 判定には impressions/clicks の絶対的低さ
だけでなく「需要がそもそも無い」ことの積極的証拠が要る。本テーマは GA4 で pageViews 63-166/週の実利用が
あり、`retire-candidate` の根拠にはならない）。レビュー (2026-07-11) の提案は妥当性が実測で裏付けられた
ため、**PR-1 (鮮度非依存のカタログ是正) の実装を推奨**。PR-2 (social-increase-rate の鮮度解決) はデータ
パイプライン変更を伴うため本監査のスコープ外 (レビュー通り分離)。

## 変更案

- レビュー PR-1 の内容を踏襲: `population-growth-rate` を primary 追加、`natural-increase-rate` を
  primary へ昇格、`crude-birth-rate` を secondary へ降格、`population-density-per-km2-inhabitable-area` /
  `day-time-population-ratio` を context へ降格、`total-population` を secondary へ昇格。
- 10 チャートのうち `rankingLink: null` の 8 件に対応する `/ranking/<key>` を補完する (内部導線強化。
  レビューの「不採用・保留」表とは独立に、既存チャートの `rankingLink` 埋めは低リスクなので同PRに含めてよい)。
- `social-increase-rate` の primary 昇格は保留 (PR-2 = データ更新後)。カタログ上で「2019年時点」である
  ことが読者に伝わるよう、chart/selection の note に鮮度注記を追加する (PR-1 の範囲内で対応可能)。
- `relatedArticleTagKeys` は未検討。関連ブログ記事の有無を `survey-curator`/`blog-seo-strategist` 系と
  棚卸しした上で次回レビューで判断 (本監査のスコープ外、次回 evidenceRefs に追加候補として記録)。

## 実験仕様（提案・未登録）

| primary KPI | guardrail KPI | baseline (56d 実測) | d28 判定条件 | d56 判定条件 |
|---|---|---|---|---|
| GA4 pageViews (56d 合算) | GSC impressions・GA4 engagementRate | pv=206 (W24+W28 2窓合算) / imp=100 / engagementRate=0.578 (pv加重) | pv 合算が baseline 比 +15% 未満なら暫定 no-effect。季節性・一過性流入の反落解消が別途起きていないか W24 相当の再急増と混同しないよう notes に前回ピークとの位置関係を記録 | pv 合算が baseline 比 +20% 以上 かつ GSC impressions が測定可能域 (>=200/56d) に到達すれば effect-partial 以上を検討。到達しなければ insufficient-data のまま据え置き (GSC は現状 measured-low で retire 判定不可の水準) |

registered: いいえ (提案のみ。experiments.json への登録は人間承認後に theme-portfolio-manager が実行)。

## GA4 -80pv の分析結果

- W24→W28 の pageViews は 143→63 (-80pv) だが、これは **W25 (166pv、観測範囲内でのピーク) からの反落**
  であり、W20-W23 は 1→1→41→75pv という急増局面だった。W24→W28 の単純比較は増加トレンドの山の途中と
  終息点を比較しており、「品質劣化による継続的な下落」と「一過性流入源の枯渇」を区別できない。
- 同期間のサイト全体 GA4 pageViews は W24 (4,511) → W28 (6,033) で **+34%増加**しており、テーマ単体の
  反落はサイト全体のトラフィック減少では説明できない (サイト全体は伸びているのにこのテーマだけ縮んでいる)。
- **原因特定には GA4 API の source/medium 別ページ内訳が必要**だが、現行 `.claude/skills/analytics/
  ga4-improvement/reference/snapshots/<週>/{pages,channels,overview-clean,devices,daily}.csv` は
  いずれも「ページ別」と「チャネル別」が別集計 (`channels.csv` はサイト全体集計でページ次元を持たない)
  ため、`/themes/population-dynamics` に絞った流入元別の内訳は **snapshot からは取得不能**。追加の
  GA4 API 呼び出し (`sessionSource`/`sessionMedium` × `pagePath` のクロスディメンション) が必要。

## 保存先

`/Users/minamidaisuke/stats47/.claude/skills/theme/manage-theme-portfolio/reference/audits/2026-07-13-theme-deepdive-population-dynamics.md`

---

## Claude Code 実装契約

- **実装 owner agent**: `theme-designer` (カタログ設計・selection 記入・role 変更)。レビュー PR-1 の
  「実装指示」節をそのまま契約とする (本監査は追認のみで内容を変更しない)。
- **対象ファイル**: `packages/data-configs/src/theme-catalog/population-dynamics.ts` (SSOT のみ編集)。
  生成物 `packages/types/src/indicator-sets/population-dynamics.ts` /
  `apps/web/scripts/data/page-components/theme/population-dynamics.json` は手編集禁止
  (`npm run generate:catalog` で再生成)。
- **検証コマンド**:
  ```bash
  npm run generate:catalog --workspace=@stats47/data-configs
  npm run validate:catalog  --workspace=@stats47/data-configs
  npm run validate:years    --workspace=@stats47/data-configs
  npm run validate:config   --workspace=@stats47/data-configs
  npm run type-check        --workspace=@stats47/data-configs
  npm run type-check        --workspace apps/web
  ```
- **禁止事項**: 2019年の `social-increase-rate` を2024年の他指標と同一年であるかのように表示しない /
  将来推計を実績線と同じ表現で追加しない / R2 push・deploy・本番変更を行わない / 本監査ファイル以外の
  state (`portfolio.json`・`experiments.json`) をこのターンでは変更しない (実験登録は承認後に別途)。
- **R2/本番非接触の確認**: 本監査は read-only (R2 fetch のみ、GET)。ThemeCatalog・生成物・
  `.claude/todo/04_改善バックログ.md`・`.claude/state/themes/*.json` への書き込みは行っていない。
- **実装は人間承認後**: レビュー文書 (`reference/reviews/2026-07-11-theme-population-dynamics.md`) の
  「採用決定: ユーザー承認待ち」が現行状態。本監査もこれを変更しない。承認後は
  ① `theme-designer` が PR-1 を実装 → ② `theme-portfolio-manager` が `build-theme-portfolio.ts`
  で portfolio.json を再導出 (`reviewStatus` 更新) → ③ 実験登録が必要なら上記実験仕様を
  `evaluate-theme-experiments.mjs` 経由で baseline 登録。
