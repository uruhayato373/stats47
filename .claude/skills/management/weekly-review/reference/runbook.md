---
name: weekly-review
description: 週次レビューを生成する（決定的な実績収集→計画差分分析→成果・課題・学び記録）。Use when user says "週次レビュー", "今週の振り返り", "週次まとめ".
primary_agent: strategy-advisor
---

> Detailed field catalog and report template. Current skill entrypoint: `../SKILL.md`.

今週の実績を多角的に調査し、成果・課題・学びを記録する週次レビューを生成する。

## 引数

```
/weekly-review [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W10`）。省略時は今週。

## 概要

5つの観点から tool / snapshot を並列に読み、計画との差分を分析し、成果・課題・学びを構造化して記録する。来週の計画策定は `/weekly-plan` に委譲する。

## 手順

### Phase 0: NSM 週次スナップショット生成

Phase 1 の並列収集より前に、NSM（週間エンゲージドセッション数）の週次スナップショットを生成する。

```bash
node .claude/scripts/snapshot-weekly-metrics.mjs [YYYY-Www]
```

- 出力先: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`
- 内容: GA4 + GSC + PSI の確定7日/直前7日比較サマリ（`finalized7d`/`previous7d`契約・`metrics-reader.mjs` 経由）
- 既存ファイルがあればスキップ（上書きしたい場合は `--force`）
- 続く Phase 1 Track C と Track E がこの JSON を参照する

### Phase 1: 実績収集（同一セッションの並列 tool call）

5つの観点を同一セッションで収集する。数回の read / shell call で終わるため subagent は起動しない。

#### Track A: 開発活動

```
調査項目:
- git log --since="7 days ago" --oneline（コミット一覧）
- git log --since="7 days ago" --stat --format="" | tail -1（変更ファイル数・行数サマリー）
- git log --since="7 days ago" --diff-filter=A --name-only --format=""（新規作成ファイル）
- git branch -a で作業中ブランチ
- git diff --stat で未コミット変更

出力形式:
- 「開発した機能・修正」を箇条書き（コミットメッセージから要約）
- 「変更規模」（コミット数、ファイル数、行数）
- 「未コミット・作業中の変更」
```

#### Track B: コンテンツ実績

```
調査項目:
- .local/r2/blog/ 配下の記事一覧と最終更新日
  → 今週新規作成・更新された記事を特定
- 投稿台帳 `.claude/state/sns/posts.json` から投稿実績を集計 (完全DBレス。旧 D1 sns_posts は廃止):
  ```bash
  # 今週の投稿数 / 投稿待ち / 全体概況 (<monday> は ISO 文字列)
  node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const M="<monday>";
    const posted=s.query(p=>p.status==="posted"&&(p.posted_at||"")>=M);
    const pending=s.query(p=>p.status==="draft"||p.status==="scheduled");
    const cnt=(a,f)=>{const o={};for(const p of a){const k=f(p);o[k]=(o[k]||0)+1}return o};
    console.log(JSON.stringify({今週posted:cnt(posted,p=>p.platform),投稿待ち:cnt(pending,p=>p.platform),
      概況:cnt(s.loadAll(),p=>p.platform+"/"+p.status)},null,2))'
  ```
- .local/r2/sns/ 配下の新規生成コンテンツ

- ブログ新規記事キュー（`.claude/state/blog/topic-queue.json`）の消化状況:
  ```bash
  # pending / must-write / in-progress の件数と型ミックス、今週 done になった件数
  node -e 'const q=require("./.claude/state/blog/topic-queue.json");
    const c=(f)=>q.queue.filter(f).length; const by=(s)=>{const o={};for(const e of q.queue.filter(x=>x.status===s))o[e.archetype]=(o[e.archetype]||0)+1;return o};
    console.log(JSON.stringify({pending:c(x=>x.status==="pending"),must_write:c(x=>x.status==="pending"&&x.lane==="must-write"),in_progress:c(x=>x.status==="in-progress"),done:c(x=>x.status==="done"),pending型内訳:by("pending")},null,2))'
  ```
  → 今週 publish した新規記事があれば `build-topic-queue.mjs --mark-done <topicKey> --slug <slug>` で done 化する
    (in-progress のまま残っている候補も確認)。

出力形式:
- 「今週公開した記事」（新規キュー由来か是正キュー由来かを区別）
- 「新規記事キューの pending / must-write / 型ミックス」（拡充ペースの追跡）
- 「今週の SNS 投稿数」（プラットフォーム別）
- 「投稿待ちコンテンツのストック数」
```

#### Track C: パフォーマンス指標

```
調査項目:

1. コンテンツ規模を取得（完全DBレス。R2 snapshot から。旧 D1/miniflare は廃止）
   ```bash
   curl -s "https://storage.stats47.jp/app/blog/all.json" | jq '.articles | length'   # 公開記事数
   ```

2. SNS 投稿実績（投稿台帳 `.claude/state/sns/posts.json` から集計。旧 D1 sns_posts は廃止）
   ```bash
   node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");const M="<monday>";
     const cnt=(a,f)=>{const o={};for(const p of a){const k=f(p);o[k]=(o[k]||0)+1}return o};
     console.log(JSON.stringify({概況:cnt(s.loadAll(),p=>p.platform+"/"+p.status),
       今週posted:cnt(s.query(p=>p.status==="posted"&&(p.posted_at||"")>=M),p=>p.platform)},null,2))'
   ```
   - **SNS 週次運用の入口は `/sns-weekly-plan`**、SNS 週報は `/sns-weekly-report`。正典 `.claude/rules/sns-content-standards.md`

3. GA4 snapshot 取得と期間分離
   `/fetch-ga4-data last28d snapshot <当週 YYYY-Www>` を実行する。
   保存先: `.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/`
   取得ファイル:
   - raw: overview.csv / pages.csv(全件) / channels.csv / devices.csv / daily.csv
   - clean: overview-clean.csv / channels-clean.csv (country=Japan only, engagedSessions/engagementRate 含む)
   - pollution-summary.csv (overseas_sessions / notSet_sessions の bot 推定 1 行)
   KPI/WoWはJapan-onlyの`finalized7d`と、その直前で重複しない`previous7d`だけを使う。
   rawはoverseas / `(not set)`汚染の監視に限定し、clean KPIへ混ぜない。28日pages/channelsは機会発見用とし、前回snapshotとの差をWoWと呼ばない。
   `periodStart` / `periodEnd` / `windowDays` / `isFinalized` / `generatedAt` / `source` / `limitations`
   が無い、または日別行に欠損がある場合は`insufficient-data`としてKPI比較を止める。

4. GSC snapshot 取得と期間分離
   `/fetch-gsc-data last28d query snapshot <当週 YYYY-Www>` を実行する。
   保存先: `.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/`
   取得ファイル: queries.csv(全件) / pages.csv(全件) / devices.csv / countries.csv / daily.csv
   実行時に以下が自動で連鎖する:
   a. `~/Downloads/stats47.jp-Coverage-YYYY-MM-DD/` を検出し、`重大な問題.csv` と `平均読み込み時間のチャート.csv` を `gcsエラー/` に mtime 比較でコピー（最新日付 1 件のみ）
   b. API で queries/pages/devices/countries/daily を取得して snapshots 配下に CSV 保存
   c. `gcsエラー/` 配下の手動エクスポート CSV があれば index-coverage.csv / index-trend.csv として同ディレクトリへコピー
   KPI/WoWと4,000 clicks/週ゲートは、取得遅延後の`finalized7d`と直前の`previous7d`だけで判定する。
   28日queries/pages/devicesは候補発見専用。順位11〜20位、CTR機会、query gapはここから抽出するが、
   互いに重なる28日snapshot差を週次増減として報告しない。欠損日は0補完せず、`partial`と欠損日を記録する。

4.1. search-growth candidateの週次トリアージ
   ```bash
   npm run search-growth:status
   npm run search-growth:next -- --limit 10
   npm run search-growth:triage        # 最大3件 (technical/content/measurement 各1) を決定的に選出
   ```
   `triage`が期間・freshness・sample size・past effect込みでレビュー対象の最大3件を返す
   （freshness=missingはinsufficient-dataとして除外される）。
   CTR候補はpage×queryと現行title/contentを確認し、mass title rewriteを提案しない。
   通常候補は人間承認前に`.claude/todo/04_改善バックログ.md`へ追加しない。
   人間承認の機械記録は`npm run search-growth:approve -- --candidate <ID>`
   （週2件・全active WIP5以下をCLIが機械強制。却下は`search-growth:dismiss --reason "..."`）。
   承認後も翌週計画への採用は最大1〜2件。効果は`search-growth:measure`が14/28/56日の判定日を返す。

   **Coverage Drilldown データ（Phase 8、2026-04-26）**:
   GitHub Actions `gsc-url-inspection-daily.yml` が毎朝 JST 06:00 に自動取得・集計している（API 視点・自サイト把握 URL のみ）。
   レビュー本文「パフォーマンス → GSC」セクションに以下を埋め込む:
   - `.claude/state/metrics/gsc/coverage-drilldown/LATEST.md` の表（カテゴリ × 件数 × 前週比、url-inspection 由来）
   - 詳細週次データ: `.claude/state/metrics/gsc/coverage-drilldown/YYYY-Www/{category}-urls.csv`（url-inspection 由来）
   - 関連 issue: #43（[T0-DECAY-01] Coverage Drilldown 週次記録）

   **GSC カバレッジ是正ループ**:
   ユーザーが GSC UI から「ページ」export を取得していれば（API では取れない総件数・未把握 URL を含む）、是正ループを回す。
   正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` / 実行: `/gsc-coverage-remediation`。
   - 取り込み: `python3 .claude/scripts/gsc/ingest-gsc-export.py`（~/Downloads の cp932 zip を自動正規化 → `coverage-drilldown/YYYY-Www/{category}-drilldown.csv`）
   - 構築: `node .claude/scripts/gsc/build-coverage-queue.mjs`（本番 HTTP 実測で A/B 分類）
   - レビューに埋め込む: **`.claude/state/gsc/LATEST.md`**（要対応 action 別件数・カテゴリ総件数）と
     `.claude/state/gsc/coverage-totals-history.csv`（404/soft404 件数の前週比トレンド）
   - effect 判定は再送信 URL の coverageState 遷移を実測してから（`evidence-based-judgment.md`）。
     真実源は `.claude/state/gsc/coverage-remediation-queue.json`。今週実行する場合だけ
     `.claude/todo/03_今週の計画.md` から参照し、完了済みの旧改善IDをTODOへ戻さない。

4.5. AdSense snapshot 取得
   `.env.local` に AdSense OAuth クレデンシャル（CLIENT_ID / SECRET / REFRESH_TOKEN / ACCOUNT_ID）が揃っている場合のみ実行:
   `/fetch-adsense-data snapshot <当週 YYYY-Www>` を実行する。
   保存先: `.claude/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/`
   取得ファイル: overview / daily / devices / units / formats-platforms / placements-platforms /
   bid-types-platforms / traffic-sources / countries / pages.csv + `manifest.json`（期間 metadata・status）
   取得完了後、`/adsense-improvement observe` で閾値と進行中施策を判定し、結果を`.claude/todo/04_改善バックログ.md`へ反映する。
   **クレデンシャル未設定時はこのステップをスキップし、レビュー本文に「AdSense OAuth 未設定」と 1 行記載する**。

   **AdSense 週次候補（CI が自動生成）**: `.claude/state/metrics/adsense/candidates-latest.json`
   （`npm run metrics:adsense-diagnostics -- <week>` で再生成可）をレビューへ載せる。
   - 候補は最大3件・**AdSense 実験の採用は最大1件/週・active WIP≤2**。1実験1レバーのみ。
   - CPC は**公式 `cost_per_click`** を使う。`earnings_per_click_legacy`（旧 cpc 列）は公式 CPC ではない。
   - unit/format/placement の比較は `IMPRESSIONS_RPM`（unit の Page RPM は分母0で無意味）。
   - `privacy-threshold`（pages 0行）を欠損・0 と混同しない。rolling 28日差を WoW と呼ばない。

4.6. R2 ストレージ定点観測 (Cloudflare cost)
   `.claude/state/metrics/cloudflare/LATEST.md` の `r2_storage_gb` を読み、前週比を確認する。
   増勢が続く場合は `.claude/todo/04_改善バックログ.md` の `[R2-STORAGE-01]` を更新する
   (保持・削除ポリシーの正典: `.claude/rules/r2-storage-design.md`「R2 保持・削除ポリシー」)。

5. SNS パフォーマンス指標
   - **最新値（プラットフォーム別集計）** は投稿台帳 posts.json のキャッシュカラム（`impressions / likes / reposts / replies / bookmarks / metrics_updated_at`）から取得（旧 D1 sns_posts は廃止）:
     ```bash
     node -e 'const s=require("./.claude/scripts/lib/sns-posts-store.cjs");
       const posted=s.query(p=>p.status==="posted");
       const acc={};for(const p of posted){const a=acc[p.platform]||={posted:0,impressions:0,likes:0,comments:0,reposts:0};
         a.posted++;a.impressions+=p.impressions||0;a.likes+=p.likes||0;a.comments+=p.replies||0;a.reposts+=p.reposts||0}
       const topX=s.query(p=>p.platform==="x"&&p.status==="posted").sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,5)
         .map(p=>({content_key:p.content_key,impressions:p.impressions,likes:p.likes,reposts:p.reposts}));
       const maxU=Math.max(0,...posted.map(p=>Date.parse(p.metrics_updated_at||0)||0));
       console.log(JSON.stringify({最終更新:maxU?new Date(maxU).toISOString():null,platform別:acc,X上位:topX},null,2))'
     ```
   - **時系列履歴（週次トレンド）** は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` から:
     ```bash
     # 直近 14 日分の snapshot を合算（sns-metrics-store.cjs の readByRange を使うと手軽）
     node -e "const s=require('./.claude/scripts/lib/sns-metrics-store.cjs'); const d=new Date(); const end=d.toISOString().slice(0,10); d.setDate(d.getDate()-14); const start=d.toISOString().slice(0,10); console.log(JSON.stringify(s.readByRange(start,end).length+' rows'))"
     ```

6. SNS メトリクスのレビュー本文への埋め込み
   SNS の週次ハイライトは本レビュードキュメントの本文に直接記載する。
   GA4/GSC の詳細データは snapshot CSV (`.claude/skills/analytics/{gsc,ga4}-improvement/reference/snapshots/`) と改善ログ (`.claude/todo/04_改善バックログ.md`) に分離済みなので、レビュー本文では「主要指標の前週差 + 改善ログ section 参照」のみに圧縮する。

出力形式:
- 「パフォーマンス概況」（overview.csv / GSC サマリー + AdSense + SNS の主要指標を 1 行で明記）
- 「注目すべきトレンド」（流入経路の変化、上昇/下降クエリ、再生数の伸び、RPM 変化）
- 「改善候補」（CTR が低い高表示クエリ、順位 11-20 位のクエリ — queries.csv から抽出）
- 「snapshot 参照」（`.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/snapshots/YYYY-Www/` と各期間）
- 「検索成長候補」（最大3件。期間・証拠・制約・承認状態）
- 「施策効果判定」（`.claude/todo/04_改善バックログ.md`のdue施策を14/28/56日窓で判定）
```

#### Track E: NSM 実験進捗

```
調査項目:

1. `.claude/state/experiments.json` から status が running / measuring の実験を抽出
   ```bash
   node .claude/scripts/lib/experiments-state.mjs active
   node .claude/scripts/lib/experiments-state.mjs pending
   ```

2. 各 active 実験について、Phase 0 で生成された週次 snapshot JSON（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）を参照し、baseline と今週値の delta を計算
   - baseline → snapshot の該当メトリクス（例: `gsc_weekly_clicks`, `engagedSessions`, `gsc_total_errors`）
   - started_at から経過日数を計算（10 日未満なら「measure 判定はまだ早い」と注記）

3. **measure 候補の抽出**: started_at から 10 日以上経過、かつ status が running の実験 → 「measure 実行候補」として surface

4. **継続作業の surface**: `pending_user_actions` が 0 件でない実験 → 「ユーザー作業が残っている」として明示

出力形式:
- 「active 実験一覧」（id / title / status / 経過日数 / baseline → 今週値 の簡易 delta）
- 「measure 実行候補」（10 日以上経過した running 実験）
- 「継続作業が必要な実験」（pending_user_actions）
- 「次確認日が近い実験」（next_check_date）
```

#### Track D: 計画との差分

```
調査項目:
- 当週の計画ドキュメント `.claude/todo/03_今週の計画.md` を取得
  → frontmatter の `week` が対象週と一致することを確認
  → Read tool で本文を取得し、計画されていたタスク（Must / Should / Could のチェックボックス）の一覧を抽出
  → git log と照合して完了/未達を判定
- 今週 close された Issue（`gh issue list --state closed --search "closed:>=<today-7d>"`、enhancement / auto-generated ラベル等）
- 今週追加・更新されたレビュー由来TODO
  `git diff --since` 相当で `.claude/todo/{04_改善バックログ,05_機能バックログ}.md` のID差分を確認

「前週からの引き継ぎ」: 直前の週次レビューの申し送りと `.claude/todo/03_今週の計画.md` を照合し、本レビューの「計画 vs 実績」で「継続」「持ち越し」と判定する。

出力形式:
- 「計画タスク vs 実績」の対照表
- 「計画外で実施したこと」
- 「未達タスクの理由（推定）」
```

### Phase 2: 分析・統合

5エージェントの結果を統合し、以下を分析する:

1. **達成率**: 計画タスクの完了率。Must / Should / Could 別の達成率
2. **成果ハイライト**: 今週のトップ3〜5の成果（インパクト順）
3. **課題・ブロッカー**: 未達タスクの原因分析。繰り返しパターンの検出
4. **計画外作業**: 計画にないが実施した作業。なぜ発生したか
5. **学び**: バグ解決、設計判断、ツール・手法の発見
6. **数値変化**: 記事数・SNS指標の週次差分
7. **NSM 実験進捗**: Track E の出力から、measure 候補と継続作業を抜き出して Phase 3 へ引き渡す

### Phase 2.5: 実測値の反映先確認

旧「実装ロードマップ」文書は廃止済み。実測値は `.claude/todo/02_今月の重点.md` の重点判断と
`.claude/todo/04_改善バックログ.md` の effect 判定に反映し、収益判断は `docs/00_プロジェクト管理/02_収益化戦略.md` のゲートに従う。

#### 取得するデータ

```bash
# 完全DBレス: 本番アプリは R2 snapshot / git TS のみ読む。旧 D1/miniflare は廃止
R2="https://storage.stats47.jp"
echo "公開記事数:       $(curl -s "$R2/app/blog/all.json" | jq '.articles | length')"
echo "ランキング(公開):  $(curl -s "$R2/app/ranking-items/all.json" | jq '.count')"   # 旧 metrics_active / 観測値を持つ metric 数の代理
echo "カテゴリ数:       $(curl -s "$R2/app/categories/all.json" | jq '.count')"
echo "相関ペア総数:     $(curl -s "$R2/app/correlation/stats.json" | jq '.total')"      # strong は .strong
echo "テーマ数:         $(npx tsx -e 'import {ALL_THEMES} from "./apps/web/src/features/theme-dashboard/config/all-themes.ts";console.log(ALL_THEMES.length)')"
# area_profiles は Derived（エフェメラル計算 → R2 app/areas/<code>/profile.json、47 都道府県分）
```

- `.local/r2/sns/` 配下の画像・動画数（`find .local/r2/sns -name '*.png' -o -name '*.jpg' | wc -l` / `find .local/r2/sns -name '*.mp4' | wc -l`）
- `.local/r2/note/` 配下の note 原稿数
- SNS 投稿実績: DB `sns_posts` テーブルから posted 件数を集計（プラットフォーム×コンテンツ種別）
- CLI スキル数: `.claude/skills/` 配下の `SKILL.md` の数

#### 更新ルール

- `現在のステータス（YYYY-MM-DD 実測値）` の日付を今日に更新
- テーブル内の数値を実測値に置換
- 状態（✅/⚠️/❌）は実測値に基づいて判断
- **「基本方針」「Sprint 定義」「凍結タスク」は変更しない**（人間が意図的に変更する部分）
- **「完了済み資産」セクションの数値も実測値で更新する**

### Phase 3: ナレッジ抽出

今週の作業から `/knowledge` スキルに記録すべき知見があれば提案する:
- 再利用可能なパターン
- ハマったポイントと解決策
- 設計判断の根拠

### Phase 4: 出力

Write tool で `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` を作成する。frontmatter を必ず含めること。

```yaml
---
type: weekly-review
week: 2026-Www
date: 2026-MM-DD
status: active
tags: []
---
```

作成後、ファイルパスを報告する。改善施策は`.claude/todo/04_改善バックログ.md`のID、実装課題は`.claude/todo/05_機能バックログ.md`のIDで参照する。GitHub IssueはPRでcloseする機能改修・bugと自動アラートだけに限定する。

### Phase 4.5: 現在計画を維持

レビュードキュメント作成後も `.claude/todo/03_今週の計画.md` は変更しない。次回 `/weekly-plan` が上書きする。

対象ファイルが見つからない場合（稀）はスキップし、報告に明記する。

### Phase 5: 週次計画（依頼範囲に含まれる場合のみ）

ユーザーの依頼に週次計画が含まれる場合だけ、当週レビューの保存後に`/weekly-plan`を実行して来週の計画を生成する。レビュー単独依頼では実行しない。

- 対象週: レビュー対象週の翌週（例: W11 レビュー → W12 計画）
- レビュー結果の「来週への申し送り」が計画の入力になる
- search-growth候補は人間承認済みのものだけ最大1〜2件を採用する

## 出力フォーマット（ファイル本文）

```markdown
---
type: weekly-review
week: YYYY-Www
date: YYYY-MM-DD
status: active
tags: []
---

# Weekly Review YYYY-Www

## 週
- **ISO Week**: YYYY-Www
- **期間**: YYYY-MM-DD 〜 YYYY-MM-DD
- **計画ドキュメント**: `.claude/todo/03_今週の計画.md`（レビュー生成時点）

## サマリー

- 計画タスク達成率: N/M（N%）
- 主な成果: （1行で）

## 計画 vs 実績

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| ... | Must | 完了/未達/一部 | ... |

計画外作業:
- ...

## 成果ハイライト

1. **成果名**: 詳細（インパクト・背景）
2. ...

## 開発活動

- コミット数: N
- 変更ファイル数: N（+N行 / -N行）
- 主な変更:
  - ...

## コンテンツ実績

| 種別 | 今週 | 先週 | 増減 |
|---|---|---|---|
| 公開記事 | N | N | +N |
| SNS 投稿 (X) | N | N | +N |
| SNS 投稿 (Instagram) | N | N | +N |
| 投稿待ちストック | N | — | — |

## NSM 実験進捗

Phase 0 で生成された週次 snapshot（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）を参照。

### active な実験

| id | title | status | 経過 | baseline → 今週 | 次アクション |
|---|---|---|---|---|---|
| EXP-NNN | ... | running | N 日 | clicks 98 → 135 (+37%) | measure 候補 |

### measure 候補（10 日以上経過した running）

- EXP-NNN: `/nsm-experiment measure EXP-NNN` を来週実行

### 継続作業が必要な実験

- EXP-NNN: pending_user_actions が N 件残存

## パフォーマンス

詳細データはsnapshot CSVと改善バックログを参照し、レビュー本文では期間付き主要指標と施策IDだけを記載する。

### GA4 KPI（Japan-only確定7日）

| 指標 | finalized7d | previous7d | 差分 |
|---|---|---|---|
| pageViews | N | N | +N |
| sessions | N | N | +N |
| engagedSessions | N | N | +N |
| activeUsers | N | N | +N |
| engagementRate | N% | N% | — |

両期間の`periodStart`〜`periodEnd`を明記する。Japan-only daily sliceがない、日別行が欠ける、期間が重なる場合は比較せず`insufficient-data`とする。

### GA4機会発見・pollution監査（ローリング28日）

snapshot CSV: `.claude/skills/analytics/ga4-improvement/reference/snapshots/YYYY-Www/`

raw - cleanの差分:

- overseas_sessions: N（前週 N, +N% 増減）
- notSet_sessions: N（前週 N, +N% 増減）
- ⚠️ overseas / notSet が前週比 +30% 超で増えた場合は、GA4 Admin のbot filter確認と
  Cloudflare WAF候補を `.claude/todo/04_改善バックログ.md` に具体化

主要な動き:
- Organic Search (clean): N → N (+N) ※ clean ベースで評価
- 上位ページの変化: pages.csv の Top 3 を 1 行ずつ

### GSC KPI（確定7日） — snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`

| 指標 | finalized7d | previous7d | 差分 |
|---|---|---|---|
| 合計クリック | N | N | +N |
| 合計表示 | N | N | +N |
| 平均 CTR | N% | N% | — |
| 平均順位 | N | N | — |

`periodStart`〜`periodEnd`を両期間について明記する。2期間が重なる、日別行が欠ける、取得遅延を満たさない場合は比較せず`insufficient-data`とする。

### GSC機会発見（ローリング28日）

snapshot CSV: `.claude/skills/analytics/gsc-improvement/reference/snapshots/YYYY-Www/`

上位クエリ・改善候補（queries.csv / pages.csv / devices.csvから抽出）:
- 順位 11-20 位で表示 > N の「あと一押し」クエリを 3 件
- CTR < 2% で表示 > N のタイトル改善候補を 3 件
- ローリング28日は候補のsample確保に使い、前回snapshotとの差をWoWと呼ばない
- `search-growth:next`からレビューへ載せる候補は最大3件。人間承認前に`.claude/todo/04_改善バックログ.md`へ追加しない

### インデックスカバレッジ（GSC 画面からの手動エクスポート）

`snapshots/YYYY-Www/index-coverage.csv` が存在する場合は以下を 1 行で:
- 404 / 5xx / ソフト404 / クロール済み未登録 / 検出未登録 / 登録済みの前週差

**GSC Alert**: `/gsc-improvement observe` のアラート判定結果を 1 行で記載（閾値非超過なら本節は省略）:
- 登録済み ≤ -10% / 404 ≥ +5% / 5xx ≥ +20% のいずれか発火時、対象指標と対応方針を明記

**施策効果サマリ** (`.claude/todo/04_改善バックログ.md` を Read し `status: pending` 以外の行を抽出):

| Section | Tier | 経過日数 | ターゲット | status |
|---|---|---|---|---|

observe モードがこの週に判定変化を起こした施策のみを列挙。以下のルールで整形:
- status が **先週から変化** した施策は行末に `(変化)` マークを付与（pending→partial 等）
- `effect/adverse` が含まれる場合は **このセクション冒頭で警告**
- 着手待ち（`effect/pending` かつ経過日数 < 14）の Tier 1 施策は下部に「待機中」として別枠で列挙

**ブログ品質是正キューの進捗** (`.claude/state/blog/remediation-queue.json` の `summary` を Read):

```bash
node -e 'const q=require("./.claude/state/blog/remediation-queue.json");console.log(q.summary)'
```

- 「pending N (must-fix M) / done D」を 1 行で記載し、**前週比で pending がいくつ減ったか**を明記する (順次品質向上の進捗指標)。
- この週に remediated_at が付いた記事 (= 今週是正した wave) を抽出し、対応する `## [BLOG-WAVE-<wave_id>]` (gsc.md) の効果を判定する。
  due (デプロイ +28 日) を過ぎた BLOG-WAVE は GSC clicks/CTR の before/after で effect 判定 → gsc.md の `status:` を更新 (`.claude/rules/evidence-based-judgment.md` 準拠、実測コマンド併記)。
- 仕組み全体 (床): `.claude/rules/blog-remediation-loop.md`。

**ブログ勝ち要因 (天井ループ・GSC 更新後に実行)**:

```bash
node .claude/scripts/blog/analyze-winning-patterns.mjs   # CTR×構造特徴→featureSignals + 順位交絡統制
```

- 最新 `.claude/skills/blog/analyze-winning-patterns/reference/reports/<date>.md` の
  **robust かつ confidence hi/mid** のシグナルを 1-2 行で記載。
- **robust な勝ちパターンのみ** `.claude/rules/blog-quality-standards.md` への書き戻しを検討 (定性裏取り後、`evidence-based-judgment.md` 準拠)。weakened/confounded は書き戻さない。

### AdSense（過去 7 日） — snapshot CSV: `.claude/skills/analytics/adsense-improvement/reference/snapshots/YYYY-Www/`

`.env.local` に AdSense OAuth 未設定の場合は本節を省略し「AdSense OAuth 未設定」と 1 行記載。

| 指標 | 今週 | 前週 | 差分 |
|---|---|---|---|
| Earnings | ¥N | ¥N | +¥N |
| Page RPM | ¥N | ¥N | +¥N |
| CTR | N% | N% | — |
| Viewability | N% | N% | — |

主要な動き:
- 収益 Top 3 ページ（pages.csv から抽出）
- 広告ユニット別 RPM の変化

### SNS パフォーマンス

※ 最新値は投稿台帳 `posts.json` のキャッシュカラムから（`sns-posts-store.cjs` 経由。完全DBレス。旧 D1 sns_posts は廃止）、時系列履歴は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` から取得する（詳細は Phase 1 Track C 参照）。

| プラットフォーム | 計測投稿数 | インプレッション / 再生数 | いいね |
|---|---|---|---|
| X | N | N imp | N |
| TikTok | N | N views | N |
| Instagram | N | N reach | N |

最終取得日: YYYY-MM-DD（未取得の場合は「`/update-sns-metrics` 未実行」と記載）

## 課題・ブロッカー

1. **課題名**: 原因分析、影響範囲
   - 対策案: ...

### 繰り返しパターン

（過去の週次計画・レビューと照合して検出された繰り返しパターン）

## 学び・ナレッジ

- **知見タイトル**: 詳細
  - `/knowledge` に記録推奨: はい/いいえ

## 来週への申し送り

- 未達タスクの引き継ぎ
- 来週注意すべきこと
<!-- 次回 /weekly-plan が .claude/todo/03_今週の計画.md に引き継ぐ -->

## 関連ドキュメント・施策

<!-- 改善は .claude/todo/04_改善バックログ.md、実装は .claude/todo/05_機能バックログ.md のIDで参照 -->
<!-- レビュー由来の未完了策は改善/機能backlog IDで参照 -->
```

## 運用ルール

- **毎週日曜〜月曜に実行**する想定。`/weekly-plan`は依頼範囲に含まれる場合だけレビュー後に実行する
- `.claude/todo/03_今週の計画.md` が存在しない、または対象週と異なる場合でも、git log ベースで実績を収集する
- 週次レビュー履歴は本skill referenceへ蓄積し、批判的レビュー全文は蓄積しない
- `/weekly-plan` の Phase 1 Track D が前週のskill referenceレビューを参照する

## 保存先 / TODO (.claude/todo/)

- 本スキル出力: `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md`
- 計画: `.claude/todo/03_今週の計画.md`（レビューでは変更しない）
- 改善施策: `.claude/todo/04_改善バックログ.md`
- 未着手の機能・自動化: `.claude/todo/05_機能バックログ.md`
- GitHub Issue: PRでcloseする機能改修/bug、または日次自動アラートだけ
- 当週に追加・更新したレビュー由来TODO IDを関連施策として列挙する

## 実証チェックリスト（改善バックログのeffect status変更前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] **observe フェーズの実証コマンドを必ず実行したか**:
  - GSC URL Inspection: `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 20`（日次のデルタを history.csv で比較）
  - GA4 / AdSense: `/fetch-ga4-data last7d`、`/fetch-adsense-data last7d` で前週比を取得
  - PSI: `.claude/state/metrics/psi/LATEST.md` を読み、変化があれば実測 URL を再 PSI
- [ ] 各改善施策（`effect/pending`）に「経過 N 日 / 想定 X / 実測 Y」を必ず書いたか
- [ ] effect/*変更の根拠コマンドを改善ログまたはバックログに残したか（後追い検証可能）
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を週次レビュー本文で使っていないか
- [ ] **observe失敗（API quota over・データ未到着）時に効果判定をせず、`insufficient-data`と理由をレビューへ明記したか**

このチェック未満なら effect/full / effect/partial への変更を保留。effect/pending のままにすること。

### 早期警戒トリガー（週次 cutoff を絶対視しない）

週次レビューで「N 週後の中間判定」を計画していても、URL Inspection API / GA4 / PSI の **日次観測** で早期判断する:

| 警戒レベル | 条件（GSC 例） | アクション |
|---|---|---|
| 緑 | 想定通り | 観測継続 |
| 黄 | 経過 1 週間後で実測 / 想定 < 30% | 仮説の再検討 + 補強施策の準備 |
| 赤 | 経過 2 週間後で実測 / 想定 < 30% | 中間判定を待たず effect/none + 次施策へ |

ルーブリック詳細: 各 improvement スキル配下の `reference/rubric-rationale.md`

## 参照

- `.claude/skills/management/weekly-review/reference/reviews/` / `.claude/todo/03_今週の計画.md` — 過去レビューと現在計画
- `.claude/skills/analytics/gsc-improvement/reference/snapshots/` — GSC rolling28d discovery snapshot
- `.claude/skills/analytics/ga4-improvement/reference/snapshots/` — GA4 clean/raw snapshot
- `.claude/skills/analytics/adsense-improvement/reference/snapshots/` — AdSense週次snapshot
- `.claude/todo/04_改善バックログ.md` — 施策status・due・ownerのSSOT
- `docs/02_実装計画/00_INDEX.md` — 実装計画の現在地
- `docs/00_プロジェクト管理/02_収益化戦略.md` — NSM・収益レーン・意思決定ゲート
- `.claude/state/sns/posts.json` / `.claude/skills/analytics/sns-metrics-improvement/snapshots/` — SNSコンテンツ状況・メトリクス
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得手順（snapshot モード）
- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得手順（snapshot モード）
- `.claude/skills/analytics/fetch-adsense-data/SKILL.md` — AdSense データ取得手順（snapshot モード）
- `.claude/skills/analytics/ga4-improvement/SKILL.md` — GA4改善の観測手順
- `.claude/skills/analytics/gsc-improvement/SKILL.md` — GSC改善の観測手順
- `.claude/skills/analytics/adsense-improvement/SKILL.md` — AdSense改善の観測手順
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画スキル（ペア運用）
- `.claude/skills/management/knowledge/SKILL.md` — ナレッジ記録

注: 廃止履歴
- `docs/60_運用ログ/weekly-metrics/` — snapshot CSV で代替（2026-04-17 削除）
- DB `seo_tracking` / `seo_actions` テーブル — 完全DBレス化で廃止。施策SSOTは`.claude/todo/04_改善バックログ.md`
- 旧GitHub Issue中心のimprovement運用 — `.claude/todo/04_改善バックログ.md` + 各skillの`reference/improvement-log.md`へ移行
- GitHub Issues `weekly-plan` / `weekly-review` ラベル — ファイル運用へ移行済み。計画は `.claude/todo/`、レビューは本skill reference
