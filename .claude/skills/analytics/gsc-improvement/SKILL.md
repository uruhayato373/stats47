---
name: gsc-improvement
domain: site
description: Google Search Console の検索実績・画面の全除外理由・通知・Dataset等の拡張を調査し、是正とGoogle再検証を週次・月次レビューへ渡す。Use when user says "GSC改善", "GSC画面確認", "GSC記録", "インデックス改善", "SEO課題記録", or when analyzing gscエラー/ CSV files.
primary_agent: gsc-analyst
---

GSC の週次メトリクス（Clicks / Impressions / CTR / Position / Index Coverage）を
active 一覧と append-only の詳細ログに責務分離して追跡するスキル。

検索パフォーマンスとインデックス状態の効果は 2〜4 週間遅延するため、「何をいつしたか」「数値がどう動いたか」「次の候補は何か」を append-only で記録する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス CSV | git: `data/gsc/snapshots/YYYY-Www/` | immutable、diff 比較、オフライン可 |
| 目標しきい値設定 | git: `.claude/config/budgets/gsc-improvement/budgets.json` | プロジェクト設定 |
| 詳細ログ (agent 用) | git: `data/improvement/gsc-improvement/improvement-log.md` | 過去判定の根拠・検証コマンド・仮説を含む詳細 |
| 要約 (人間向け) | git: `.claude/todo/improvements.md` | active 施策の ID・要約・status・期日を俯瞰 |
| 週次スナップショット | `data/gsc/{history.csv,LATEST.md}` | GitHub Actions が金曜 JST 05:00 に前週分を自動更新 |
| 運用サイクル監査 | `data/gsc/operations-cycle-LATEST.{json,md}` | 計測→review→候補判断→plan→月次集約の接続状態 |
| 画面監査・技術是正の証拠 | `data/gsc/ui-audits/` | 日付付きJSON。GSC表示値・メッセージ・公開HTTP・Google検証の観測日時を区別する |
| 技術是正の未完了タスク | `.claude/todo/backlog.md` | 優先度・owner・次の確認日・停止条件・完了条件。効果観測の施策と二重起票しない |

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot 取り込み + 目標判定 + 施策効果追記
               - action  : 新しい施策行を .claude/todo/improvements.md に追加
               - next    : 次に着手すべき改善候補を提示
```

## 手順

### Step 1: データソースの特定

GSC メトリクス取得の優先順:

1. **`/fetch-gsc-data` スキル** — API 経由で `data/gsc/snapshots/YYYY-Www/` に CSV を保存
2. **`data/gsc/snapshots/` 配下の既存 CSV** — 既に取得済みの週次データ
3. **GSC 画面からの手動エクスポート** — API で取れない index-coverage 詳細等

### 画面監査・技術是正とレビューへの引き渡し

検索実績API・既存coverageキューだけでは、今回の画面監査を実施したことにはならない。
画面確認の運用は本節、URL群の機械分類は `/gsc-coverage-remediation` を正典とする。
除外理由の内訳は週次の取得 (木曜の Mac。`data/gsc/coverage-drilldown/`) で読む。セッションで画面を開くのはオーナーが会話で頼んだときだけ
(読むための操作は hook が止める。`.claude/rules/recorded-measurement-first.md`)。

1. **propertyと日時**: `sc-domain:stats47.jp` を画面で照合する。認証profile・lock・終了時の清掃は
   `docs/01_技術設計/07_Playwright認証プロファイル.md` に従う。ログイン・2FA・CAPTCHAは人間へ戻し、古い成功を最新扱いしない。
2. **調査範囲**: 「ページ」の表示中の全除外理由、サイトマップ、メッセージ、新規/継続中の拡張エラーを確認する。
   各理由の総件数・例示件数・レポート最終更新日・前回クロールを記録する。メッセージは通知日・本文・対象・必要な処置を読む。
   Dataset等のアイテム数をページ数へ置き換えない。未読・未取得の理由/通知は0件とせず未確認とする。
3. **本番との突合と優先順位**: sitemap/内部リンクにある現役URLの404・5xx・意図しないrobots/noindex/canonicalを優先する。
   通常/Googlebot UAのHTTP・本文・canonical・robotsと、必要なら実際のGoogleライブテストを突合する。
   意図的な廃止・転送・重複は正常な除外として分ける。カテゴリ名だけで正常/異常を決めず、未登録総数0を目標にしない。
   構造化データは親だけでなく入れ子を辿り、出典の作成者・利用条件を推測で補完しない。
4. **是正**: 原因を特定し、既存owner（URL/画面・Geo・Dataset・計測期間等）へ渡す。
   採用した未完了策だけを既存backlogへ統合し、P1/P2/P3・実行順・次の確認日・停止/完了条件を付ける。
   ローカル検証、承認済みの本番反映、公開HTTP/データ/回帰gateの結果を分けて記録する。
5. **Googleでの再検証**: 本番の修正確認後、依頼範囲でGSCの該当問題の「修正を検証」やネイティブの登録リクエストを行う。
   受理・初期検証中・検証開始・合格/失敗・実際の登録/除外を別々に記録し、件数更新や登録完了を推測しない。
   通常ページにIndexing APIを使わず、割当超過時に迂回・反復送信しない。技術復旧を検索流入の効果と混同しない。
6. **記録**: `data/gsc/ui-audits/` の監査/是正JSONと、`data/improvement/gsc-improvement/improvement-log.md` に根拠を残す。
   観測日、対象、報告値と例示範囲、修正/PR/deploy、公開確認、Google検証状態、未確認点、残カードIDと次回確認日を含める。
   既存監査は保持し、後続観測は日時付きで区別する。保存先と保持数は `config/datasets.mjs` の登録を使う。

**週次**: `/weekly-review` は上記証拠・詳細ログ・残backlogを必ず読み、「計測→記録→改善サイクル」に技術是正を載せる。
新しい通知、前回監査から7日超、または次回確認日到達時は、未確認/検証中の該当画面を本節で再確認する。
取得できなければ前回値のまま未確認としてBlockersへ渡す。レビュー本文には少なくとも
`対象/問題 | 観測日・報告値/例示範囲 | 本番確認 | Google検証 | 残カードID・次回確認日 | 証拠`
を残す。新規対応が無い週も「観測済みで変更なし」と「未取得」を区別する。

**月次**: `/monthly-review` は対象月の週次レビューに加え、同じ証拠・詳細ログ・残backlogを読み、
その月に扱った問題ごとの技術復旧、Google再検証の遷移、残P1/P2・期限超過・再発を集約する。
月次の画面点検は表示中の全理由・メッセージ・拡張を一巡し、対象月末より後の観測は月末値へ混ぜず「後続確認」とする。
同じ問題を毎週の値から重複加算せず、意図した除外が残ることだけで未達としない。

作業実績は実行日時のJST週/月、GSC件数はレポートの観測日、検索KPIは確定7日/非重複比較窓に帰属させる。
後日の本番反映・検証開始を過去週の完了として遡及記載しない。期日到達の未完了は実在するカードIDで申し送る。

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
以下を並列に実行して要約:
1. data/gsc/snapshots/ 配下の最新 YYYY-Www ディレクトリの CSV を Read
2. .claude/todo/improvements.md の6列表から status: pending / in-progress / effect-pending の行を抽出
3. data/improvement/gsc-improvement/improvement-log.md を Read し未判定の検証コマンド一覧を抽出
4. data/gsc/LATEST.md を Read し週次推移を取得
5. `node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monitor` を実行し、未接続工程を取得
6. data/gsc/ui-audits/ と詳細ログ・backlogを Read し、本番反映/Google検証中/次回確認日を上記契約で要約

出力:
- 最新 snapshot の主要指標 + 目標超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - status」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. /fetch-gsc-data snapshot <YYYY-Www> を呼び data/gsc/snapshots/YYYY-Www/ に CSV 保存
   b. 既に存在するなら既存 CSV を読む
   c. 手動エクスポートが必要な index-coverage 詳細はユーザーに依頼

2. 主要指標を抽出:
   - queries.csv: 合計 clicks / impressions / ctr / position
   - pages.csv: 合計 + 上位 10 ページ
   - daily.csv: 日次トレンド
   - index-coverage.csv: 登録済み / 除外理由別件数
   - devices.csv, countries.csv: 参考

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. 前週 snapshot との前週比を計算:
   - data/gsc/snapshots/ の直近 2 週分を比較
   - data/gsc/history.csv から取得しても可

5. 進行中施策の効果判定（最重要）:
   ```bash
   node .claude/scripts/lib/effect-verdict/cli.mjs --week <YYYY-Www>
   node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week <YYYY-Www>
   ```
   - effect ラベルの自動判定は `effect-verdict` の閾値・4ガードを正典とし、同じ比較を手作業で再実装しない。
   - `insufficient-target` は推測で補わない。`.claude/config/gsc-operations-cycle.json` の既知負債以外が1件でも増えたら運用監査をFAILにする。
   - 確定 verdict の `.claude/todo/improvements.md` 反映は `improvement-triage` に委譲する。確定済みIDがactive一覧に残れば運用監査がFAILにする。

6. 出力:
   - 目標超過アラートを先頭で強調
   - 効果判定を確定してTODOから削除した施策をハイライト
   - adverse があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策タイトル
   - tier: 1 (即効) / 2 (戦略) / 3 (要調査)
   - target_metric: gsc-clicks / gsc-impressions / gsc-ctr / gsc-position / gsc-index-coverage
   - 対象ページ / クエリ
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - deployed_at / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - verification_command（copy-pasteable な curl / API / script）

2. .claude/todo/improvements.md を Read し、該当 Tier の6列表に1行だけ追加する:

   ```markdown
   | GSC-NN | <次アクションを含む短い要約> | pending | YYYY-MM-DD | <owner> | gsc |
   ```

3. front-matter の `updated:` を本日日付に更新。
4. target metric、対象、baseline、想定効果、deployed_at、PR、検証コマンドは
   data/improvement/gsc-improvement/improvement-log.md に appendする。想定効果は必ず `[target: +N clicks]`、
   `[target: -N errors]` の機械可読記法を併記し、欠落時は action を完了しない。
5. 次の観測日（デプロイ + 14 / 28 日）を計算して提示。
```

#### mode = next

```
1. .claude/todo/improvements.md のactive行と、data/improvement/gsc-improvement/improvement-log.md の過去判定から派生候補を抽出
2. data/improvement/gsc-improvement/improvement-log.md の「次の候補」「仮説」セクションから未着手を拾う
3. 最新 snapshot の「次のアクション」候補も合わせる

優先度: tier-1 > tier-2 > tier-3
同 tier 内は想定効果の大きい順。
```

### Step 3: 共通ルール

- **.claude/todo/improvements.md は active-only** — 未完了施策の追加・status 更新に限定する。effect 確定後は詳細を improvement-log に残し、行を削除する
- **snapshots/YYYY-Www/ も append-only** — 過去の CSV は改変しない
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — "snapshots/2026-W17/queries.csv" のような相対パス
- **施策は 1 PR 1 ID** — 複数目的の PR は分割
- **想定効果値はデプロイ前に書く** — 後付けバイアス防止
- **週次の正典** — 金曜 `fetch-metrics-weekly` が前週のsnapshot+effect verdictを生成し、土曜の`/weekly-review`が候補判断を記録、日曜20:30の`gsc-operations-cycle-weekly`が接続を監査する
- **責務を分離する** — `.claude/todo/improvements.md` はactive一覧、data/improvement/gsc-improvement/improvement-log.md は判定履歴

## 参照パターン

```bash
# 直近スナップショット
ls -t data/gsc/snapshots/ | head -3
cat data/gsc/LATEST.md

# 進行中施策
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 効果測定済み施策・詳細ログ
cat data/improvement/gsc-improvement/improvement-log.md

# 「表示は伸びたのにクリックが伸びない」を面別に切り分ける
#   pages.csv を素で集計してはならない: アンカー行 (#見出し 付き URL) が page 次元 imp の
#   26% を占めクリックがゼロなので、除外しないと CTR を系統的に過小評価する。
#   rolling28d の隣接週は 21 日重複するので WoW 比較も不可。下記が両方を扱う。
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W29 2026-W33   # 非重複な 28 日窓どうし
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W32 2026-W33   # 差分 = 最新週 − 落ちた週
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs --weekly            # 日次を連結して 7 日ずつ

# 計測→review→候補判断→plan→月次集約の接続
node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monitor
node --test .claude/scripts/gsc/__tests__/audit-operations-cycle.test.mjs
```

## 実証チェックリスト（効果判定を確定してTODO行を削除する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - URL 単位の Google 認識: `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10`（pageFetchState / coverageState / lastCrawlTime を取得）
  - 本番 HTTP 挙動: `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" -o /dev/null -w "%{http_code}\n" https://stats47.jp/<path>`
  - GSC 全体 snapshot: `/fetch-gsc-data last28d page snapshot YYYY-Www`
- [ ] Google 仕様を主張するなら公式ドキュメント URL を引用したか（`developers.google.com/search/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「Google の仕様」「クロール予算枯渇」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **「Google が再クロールしているか」を URL Inspection API の lastCrawlTime 推移で確認したか**（GSC export の「サーバーエラー」レポートは古いスナップショットなので根拠にならない）

このチェック未満なら効果を確定せず、active 行を維持すること。

### 早期警戒トリガー（cutoff 日を絶対視しない）

ルーブリックの cutoff 日（暫定 21 日）を待たず、日次観測で以下に達したら早期 action:

| 警戒レベル | 条件 | アクション |
|---|---|---|
| 緑 | 再クロール件数 / 日 > 50 | 観測継続 |
| 黄 | 経過 7 日後で再クロール件数 / 日 < 5 | 案 B 準備（GSC URL 削除リクエスト下書き） |
| 赤 | 経過 14 日後で再クロール件数 / 日 < 5 | cutoff を待たず案 B フル発動 |

詳細根拠: `reference/rubric-rationale.md`

## 関連スキル

- `/fetch-gsc-data` — GSC API から生データを取得（本 skill の入力ソース）
- `/ga4-improvement` — GA4（行動分析）
- `/adsense-improvement` — AdSense（収益）
- `/cloudflare-cost-improvement` — Cloudflare コスト
- `/seo-audit` — サイト全体の SEO 監査
- `/performance-report` — Lighthouse + Core Web Vitals 監査
- `/knowledge` — 恒久的な教訓を記録

## 前提

- `.claude/todo/improvements.md` が存在（front-matter `type: improvement-log` / `metric: gsc`）
- `.claude/config/budgets/gsc-improvement/budgets.json` / `data/gsc/snapshots/` / `data/improvement/gsc-improvement/improvement-log.md` 初期化済
- GSC プロパティ: `sc-domain:stats47.jp`
- 本番 URL: `https://stats47.jp`
