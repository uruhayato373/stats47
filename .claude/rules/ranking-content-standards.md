# ランキングページ コンテンツ標準 (ranking-content-standards)

`/ranking/<key>` ページの**コンテンツ構成・品質フロア・AI 解説文の生成パイプライン**の運用正典。
ranking の ai-content (考察/構造解釈/時系列/相関/FAQ/県別解説) を生成・是正する agent (`ranking-content-author`) /
critic (`ranking-content-critic`) / 人間はこれに従う。2026-07-12 に旧ランキング品質改修計画の
運用スペック（コンテンツ仕様・パイプライン・分業）を本 rule へ抽出し、運用 SSOT を `.claude/` に一本化した。旧版が必要な場合は Git 履歴を参照する。

> **役割分担**: 戦略・KPI 目標は `docs/00_プロジェクト管理/03_マーケティング戦略.md`
> （T1〜T4・成長レバー）。
> Wave 進捗・生成の状態は **ai-content 是正キュー** (`.claude/state/ai-content/` + `build-ai-content-queue.mjs`、
> memory `project_ai_content_remediation_queue`) と backlog (AICONTENT-02 / RANK-WAVE) が持つ。
> 本 rule は「どう構成し・どの品質床で・どう生成するか」の運用正典。

## スコープ境界 — 本パイプラインは 47 都道府県ランキング専用 (★2026-08-31 宣言)

地理スコープの分離 (doc 43 = 全国 `/japan`、doc 44 = 市区町村 `/municipalities`) 以降、
ランキングページは **全国 / 都道府県 / 市区町村の 3 面**になった。本 rule と ai-content
パイプライン (queue / build-input / prompt / audit / critic / publish) が扱うのは
**都道府県 (`/ranking/<key>` → `app/ranking/<key>/ai-content.json`) だけ**である。

| 面 | 配信 namespace | ai-content |
|---|---|---|
| 都道府県 `/ranking/<key>` | `app/ranking/<key>/` | **本パイプラインの対象** |
| 市区町村 `/municipalities/ranking/<key>` | `app/municipalities/ranking/<key>/` | 対象外 (backlog `MUNI-AI-CONTENT-01`) |
| 全国 `/japan/<themeSlug>` | `app/japan/<metric>/series.json` | 対象外 (backlog `JAPAN-COMMENTARY-01`) |

パイプライン内の「47 件」「7 地方区分」「`prefectureCommentary`」「thin 閾値 40 県」
「`app/ranking/` パス固定」等 (2026-08-31 棚卸しで約 35 箇所) は**欠陥ではなく、
都道府県ドメインへ正しく特化した検査・スキーマ**である。パラメータ化して他レベルへ
流用してはならない:

- **市区町村** (1,717 自治体) では「47 件ちょうど」「40 県未満は thin」「7 地方ブロック」の
  どれも成立せず、全自治体の個別解説も量的に成立しない。必要なのは別スキーマ
  (上位/下位要約・県別分布・母集団と除外自治体の説明) と、`cities.json` 由来の values と
  突合する**専用監査**である。解禁条件と設計要点は `MUNI-AI-CONTENT-01` に固定した
- **全国** はそもそもランキングではない (`series.json` = 公式全国値の時系列。doc 43 は
  「`/themes` と同じコンテンツの URL 違いにしない」を明記)。要るとすれば時系列解説という
  第三のコンテンツ型で、本パイプラインの派生では作らない

レベルをまたいで**共有してよいのは原理だけ**: 数値の実データ突合 (number-audit の設計)、
author / critic の分離、outbox → develop push → CI 再検証の公開機構。実装・スキーマ・
閾値は共有しない (誤検知や検査の緩みを生む一般化は `unit-semantics-standards.md` §3 の
禁止事項と同型)。

機械側の可視化: `build-ai-content-queue.mjs` が LATEST.md 冒頭に市区町村の公開 key 数と
「対象外」を明示する (key が増えても黙って見えない状態を防ぐ)。

## 層別処方の原則 (全ページ一律にしない)

GSC 表示のあるランキングは全キーの ~40% で、imp の大半は Head 層 (imp≥50) に集中しかつ CTR が最低、という偏りがある。
**全ページ一律の「品質向上」は誤り。imp 層で処方を変える**:

| 層 | 目安 | 処方 |
|---|---|---|
| Head (imp≥50 & pos4-15) | 順位・CTR の問題 | §2 コンテンツ仕様をフル適用 (構造解釈フル) + seoTitle/description の CTR 改修 (1 件ずつ query 確認・一括禁止) |
| Torso (imp10-49) | 露出の問題 | 構造解釈は短縮版 (~200字) + 内部リンク強化 (category/theme/area 導線) |
| Zero (imp=0) | インデックス以前 | 内部リンク監査・thin metric は noindex 候補 (URL Inspection で index 率×thin 該当を検証) |

## コンテンツ仕様 (「データ表」から「解説付きリファレンス」へ)

1 ページあたりの固定セクション仕様:

| # | セクション | 字数目安 | データ源 |
|---|---|---|---|
| 1 | リード文 | 120-200字 | values.json (1位/最下位/格差倍率) + curiosity gap 1 文 |
| 2 | **構造解釈** ★最重要 | **300-500字** (Torso は ~200字) | 地理・産業・歴史で「なぜこの分布か」を説明 (blog archetype A の分析視点を移植) |
| 3 | 時系列ハイライト | 100-200字 | R2 `app/stats/<key>/values.json` 全年から「N年で◯倍」「順位逆転」抽出 |
| 4 | 相関の言語化 | 100-150字 | `app/correlation/by-ranking-key/<key>.json` の上位相関 + 相関≠因果 caveat |
| 5 | FAQ 6 Q&A | 既存 | `ai-content.json` (Q-DESIGN-01) |
| 6 | 定義・出典 | — | metric config `description`/`note` 整備 (`validate:config` 準拠) |

- **CTR 側 (title 不変)**: `metric-config-standards.md` 準拠で **title は正準名のまま** (年・注釈の焼き込みは lint error)。
  改修は `seoTitle` に curiosity gap パターン (なぜ/意外/倍率/vs)、`seoDescription` に緊張感セットアップ。
- **品質フロア (決定的 gate)**: ①実データ照合 (下記) ②構造解釈 ≥300字 (Torso ≥200字)
  ③NG ワードなし (`evidence-based-judgment.md`) ④ですます調 (`blog-quality-standards.md` 準拠)。
  検査は `audit-ai-content.mjs` (決定的ゲート)。
- **★通過率を上げるならゲートではなくプロンプトを直す**。最頻 blocker は `paren-number`
  (括弧内への数値挿入)。2026-07-31 に原因を特定した — ルール不足ではなく **プロンプト自身が
  禁止パターンを実演していた**(出力 JSON テンプレートのプレースホルダが `（…）` 形式で中に数値を含む)。
  モデルが最も忠実に真似るのは出力形式の例なので、そこに癖が入る。プレースホルダを `<…>` にし、
  禁止ルールを冒頭の絶対ルールへ昇格させた (`model-prompting.md`: 制約は末尾ではなく冒頭)。
  再発防止は `ranking-content-prompt.test.ts` (テンプレートに全角括弧が戻ると落ちる)。

### 実データ照合の設計 (★安いモデルで量産する前提の砦・2026-07-30 実装)

プロンプトは「括弧による数値挿入」を全面禁止するが、**FAQ の answer は実値必須・insights は倍率や
構成比を書く仕様**なので「数値を書かせない」ことでは捏造を防げない。括弧外の裸の数値を実データ
(`app/ranking/<key>/values.json`) と突き合わせる。実装は `.claude/scripts/ai-content/lib/number-audit.mjs`
(純関数 + `__tests__/`)、配線は `audit-ai-content.mjs`。

| 対象 | 判定 | level |
|---|---|---|
| **県別解説の構造フィールド** (`items[].areaCode` / `rank` / `value`) | 実データと**厳密一致** (相対 0.1%) | **blocker** `pref-data-mismatch` |
| テキストの数値 (insights / regionalAnalysis / faq / commentary) | 実データの**最大値を超える**もののみ | **blocker** `out-of-range-number` |
| 観測値が無い県の解説 | 未収録・対象外の可能性 | warn `pref-unknown-area` |
| values.json に同名の県が複数行 | どの行が正か決定できず照合不能 | warn `values-duplicate-areas` |

**テキスト側を「厳密一致」にできない理由** (公開済み 153 件で 2 度実測して失敗した):

1. 「実データから導出できる値の集合」との一致 → **破綻**。insights は地方ブロック平均を書く仕様で、
   任意の部分集合の平均は無限にあり列挙できない (誤検知例: 「近畿の7府県平均は21,415店」)。
2. 「min〜max の区間内か」 → **まだ誤検知**。プロンプトが「全国平均との比較」を指示するため差分表現が
   頻出し、差分は必ず min を下回る (誤検知例: 「全国平均を約2,849g上回り」= 実値 − 平均)。

よって下限は捨て、**max 超えだけ**を見る。狙いは桁違いの捏造 (読者が検証できず実害が最大)。
弱いゲートに見えるが**誤検知を出すゲートは運用で無効化される**ため確実性を優先し、数値の正しさの
本体は構造照合が担う。除外規則: 年表記 (2021年)・分母表現 (人口10万対)・「約」付きは許容 5%・
「12万6千」等の分割解釈はグループ単位で判定。

**ゲート自体を検証済み** (全 PASS は「何も見ていない」と区別できないため必須):
公開済み 153 件に捏造を注入した対照実験で、テキスト注入 (全国計×100) **153/153**・
構造注入 (value×2+1, rank+5) **140/153** を検出 (残り 13 は下記の観測値側欠陥で照合不能な件)。

> **★blocker が出ても「ai-content が悪い」とは限らない**。実測でこのゲートが検出した 2 件は
> **配信データ側の欠陥**だった: `vacant-housing-rate` は unit が「％」なのに values が空き家戸数
> (ai-content の率が正しい)、`dairy-cattle-count` は partition が 45 件で**北海道が欠落**し rank が
> 繰り上がっていた。**再生成する前に「どちらが正しいか」を必ず確認する** — 壊れた観測値に合わせて
> 書き換えると品質が劣化する。観測値側なら `data-ingester` / `/audit-ranking-data-integrity` へ回す。

実行:

```bash
node .claude/scripts/ai-content/audit-ai-content.mjs <rankingKey>            # R2 から取得して照合
node .claude/scripts/ai-content/audit-ai-content.mjs --file <path.json>      # 生成直後の staging
node .claude/scripts/ai-content/audit-ai-content.mjs <key> --no-number-check # オフライン (テキスト規則のみ)
node --test .claude/scripts/ai-content/__tests__/*.test.mjs                  # ゲート自体のテスト
```

values.json が取得できない場合は照合をスキップする (fail-open) が、**スキップしたことを出力に明示する**
(合格と誤読させない)。

### 接地データの健全性ゲート (★生成物ではなく素材を見る・2026-08-04 実装)

上の照合は **生成物しか見ない**。「そもそも論じるに足るデータか」を誰も見ていなかったため、
**全 47 県が 0** の `bowling-alley-public` (公共ボウリング場数) に FAQ 5 問 + 県別解説 47 件が
生成され公開された。テキスト自体は「全47都道府県において0施設となっており、突出して多い都道府県は
ありません」と正直に書いており捏造ではない。**嘘は無いが読者価値も無い**ページを 1 枠使って作った
ことが問題で、thin content のリスクでもある。

判定は `.claude/scripts/ai-content/lib/value-health.mjs` の `checkValueHealth` (純関数・テスト付き)。

| 検査 | tier | 理由 |
|---|---|---|
| `no-variance` 全県が同じ値 | **blocker** | 「1 位はどこか」に答えられない = 順位が存在しない |
| `duplicate-area` 同一県が複数行 | **blocker** | 分類軸の絞り忘れ。どの行が正か決められない |
| `over-coverage` 47 行超 | **blocker** | 都道府県は 47 しかない |
| `no-rows` / `no-finite-value` | **blocker** | 素材が無い |
| `thin-coverage` 40 行未満 | warn のみ | 港湾・漁港系は内陸県が対象外で 39 件前後が正常 (実測 34 件) |

**弾く場所はキュー選定時 (`build-ai-content-queue.mjs`) であって生成時ではない。** 生成時に弾くと
その key は needs-regen のまま翌日また上位に並び、毎日 1 枠を食い潰す (livelock)。キュー側で
`not-eligible` にすることで `--next` から恒久的に外れ、backlog の件数も正直になる。
done でも接地が不健全な key は `dataBlockers` を付けて LATEST.md に出す (公開済みの是正対象)。

**ブログ側の `checkGroundedRows` (`packages/ai-content/src/services/blog-topic-gate.ts`) との差は意図的**。
blocker の 4 検査は同じ判断だが、40 行未満をブログは reject・ai-content は warn に留める。問うている
ことが違うため — ブログは「この 1 本の記事を書けるか」(全国の傾向を論じる散文には県の網羅が要る)、
ai-content は「この ranking ページに解説を付けられるか」(ページは対象 N 県のために存在しており、
11 県しかない指標でもその 11 県の解説は成立する)。詳細は value-health.mjs の冒頭コメント。

**初回実測 (2026-08-04・active 2,176 件)**: not-eligible 2 (`gini-coefficient-disposable-income` /
`unemployment-measures-project-expenses-prefecture`) + 公開済みだが不成立 2
(`convenience-store-count-commercial` imp 1580 / `bowling-alley-public` imp 80)。

## 生成パイプライン (完全DBレス)

```
R2 values.json + correlation + metric config
  → Gemini API structured JSON (author)
  → 決定的 gate (audit-ai-content.mjs。落ちたら有界の全体再生成)
  → 別リクエストの Gemini critic (REVISE なら指摘付きで 1 回再生成)
  → outbox → publish-ai-content.yml を明示 dispatch
  → R2 app/ranking/<key>/ai-content.json + CDN purge
```

**公開までの受け渡しは 2 経路あり、実行環境で選ぶ** (混同すると生成物が公開に到達しない):

| 実行環境 | 出力先 | 公開手段 |
|---|---|---|
| R2 creds あり (ローカル / CI) | `.local/r2/app/ranking/<key>/ai-content.json` (既定) | `diff-push-r2 --prefix app/ranking` |
| **creds なし (クラウドセッション / Routine)** | `data/ai-content-staging/<key>.json` (`--outbox`) | develop へ push → `publish-ai-content.yml` が gate → R2 → CDN purge → outbox 削除 |

outbox は**フラットな `<rankingKey>.json`** でなければならない (workflow の検出 glob が
`data/ai-content-staging/*.json` なので `app/ranking/<key>/` 配下に置くと拾われない)。
`--out data/ai-content-staging` では階層が付くため公開されない → **`--outbox` を使う**。

### ★1 回の push で公開できるのは「その push の差分 × MAX_PUBLISH 件」まで (2026-09-02 実測)

push トリガーの対象選定は `git diff HEAD~1 HEAD` で、さらに `MAX_PUBLISH` (現在 40) で
上限を掛ける。**50 件を 1 つの PR で載せると 40 件しか公開されず、残りは outbox に滞留する**
(alphabetical に後ろの key が落ちる)。取りこぼしは次の push の差分にも載らないので、
放置すると永久に公開されない。

- 大量に載せるときは **1 PR あたり 40 件未満**に分けるか、公開後に未反映分を触って再度 push する
- **公開確認は「R2 にファイルがあるか」で判定しない。** 旧版が残っている key は構造検査
  (47 件の県別解説がある等) を通ってしまう。**今回生成した内容と R2 の内容を突合する**
  (2026-09-02 に `subsidy-expenses-prefecture` が旧版のまま「公開済み」と誤判定された)
- R2 の一時的な内部エラー (`We encountered an internal error`) で `diff-push-r2` が
  部分失敗すると、CDN purge と outbox 掃除ごとスキップされる。コンテンツ起因ではないので
  該当 key を触って再 push すればよい

- blog の `quality-gate.mjs` / blog-critic / `review.md` モデルを流用 (実装パターン再利用・drift 防止)。
- スクリプト配置は `.claude/scripts/ai-content/` (`skill-code-placement.md` 準拠)。R2 書き込みは CI 専用 (`r2-storage-design.md`)。
- **安いモデルで数をこなす方針** を採る場合、品質は「モデルを賢くする」ではなく
  「決定的ゲート + 再試行」で担保する。`--retries N` は JSON 崩れ・ゲート落ちを同じ prompt でやり直し、
  **ゲートを緩めて通すことは絶対にしない** (品質ではなく実行時間で払う)。落ち率はモデルを変えたら
  必ず実測する (10 件パイロット → blocker 内訳を確認 → 落ち率が高ければプロンプト側を直す)。

### ★2026-08-07: バッチは partial-publish (1 件の失敗で全件を止めない)

バッチで複数件を回すときは **オールオアナッシングにしない**。以前は対象 N 件のうち 1 件でも
audit / critic に落ちると `GENERATED != EXPECTED` で run 全体を fail させ、後続の publish
dispatch が skip され、**通過していた N-1 件も公開されずに捨てられていた** (2026-08-05 に
5 件中 4 件が PASS したのに 0 件公開・生成 $86 が無駄。`manufacturing-industry-added-value`
が 47 県 commentary の定型重複で critic を通らず毎回バッチを道連れにしていた)。

verify セマンティクス (日次 CI と対話セッションの共通規律):

- **通過分だけ publish する**。失敗キーは outbox (`data/ai-content-staging/<key>.json` /
  `docs/21_ブログ記事原稿/<slug>/`) を drop して次回生成へ繰り越す。
- **公開対象が 0 件なら「成功」と報告しない** (silent-green 防止)。
- 失敗は握り潰さず、どのキーがなぜ落ちたかを残す。
- 1 件の gate 失敗で残りの処理を止めない。

**quarantine (ai-content のみ)**: 連続で critic に落ちる常習キーは対象から外す。
`.claude/scripts/ai-content/record-generation-outcome.mjs` で失敗回数を
`.claude/state/ai-content/generation-failures.json` に積み、**3 回連続で失敗したキーを
`build-ai-content-queue.mjs --next` が除外**する (doomed key が毎回バッチの 1 枠と生成
コストを食い潰すのを防ぐ)。除外したキーは LATEST.md の「🚧 quarantine」節に理由付きで
可視化し (黙って消さない)、一度でも PASS すればカウントを消して自動で復帰する。手動 agent
での再是正やプロンプト/データ是正が要る。blog は新規記事で同じ slug を再ピックしないため
quarantine は持たない。

再発防止テスト: `.claude/scripts/ai-content/__tests__/generation-outcome.test.mjs`
(quarantine の積み上げ・PASS でのリセット) / `packages/ai-content/src/services/__tests__/`
(Gemini API・structured output・preflight・生成 0 件 gate)。

### ★2026-08-30: Gemini 無料枠の日次 CI を正典にする

`ai-content-gemini-daily.yml` を日次 07:15 JST に実行する。既定 3 件、並列数 1、
`gemini-2.5-flash-lite` 固定で開始し、クォータ実測なしに件数を上げない。実行経路は次の通り。

1. `build-ai-content-queue.mjs --scope all` で R2 から対象を再導出する。
2. 極小の structured generateContent で preflight する。ListModels は失敗時の候補提示にしか使わない。
3. author は response schema で FAQ 5 件・観測地域全件を固定する。既存の決定的監査に落ちた候補は公開しない。
4. 生成と別の Gemini リクエストが意味品質を `PASS | REVISE` で審査する。`REVISE` は指摘付きで最大 1 回だけ全体再生成する。
5. PASS 分だけ outbox へ書き、develop へコミットする。CI からの push は後続 workflow を発火しないため、`publish-ai-content.yml` を明示 dispatch し、run 成功まで待つ。
6. 件数・通過率・author/critic リクエスト数・トークン数を `.claude/state/metrics/ai-content/` へ記録する。生成本文と prompt は記録しない。

**無料運用のゲート**: `GEMINI_API_KEY` は課金を有効化していない専用 Google AI Studio
project から発行する。API は認証・quota/billing エラーを返すが、キーの project で
billing が OFF かどうかを応答から事前証明できない。コードでの「無料保証」は不可能なので、
Secret 発行元の課金無効を人間が保証する。無料 tier の入出力は Google のサービス改善に
使われ得るため、秘密・個人情報を prompt に入れない。ranking 公開観測値と公開用解説だけを扱う。

Claude Code/OAuth を使う日次 CI は復活させない。**Agent tool 経路** (`ranking-content-author` /
`ranking-content-critic` を Agent tool で起動する) の Claude は、Gemini 自動経路で 3 回 quarantine に
入った高流入 key など、例外的な手動是正にだけ使う。**headless `claude -p` 経路**によるローカル量産は
次節のとおり別扱いにする (2026-09-05)。

### ★2026-09-05: ローカル量産は headless `claude -p` 経路 (Agent tool は使わない)

Gemini 日次 CI は 2026-08-30 から鍵の前払いクレジット枯渇 (`preflight_status=billing`) で 8 run 連続
PASS 0 のまま止まり、残 1,445 件 (2026-09-04 キュー) の在庫を消化する経路が無かった。
「Opus / Sonnet に分業して Agent tool で回す」は解にならない — Agent tool 経路は **1 件 $16-18**
(`claude-usage/history.csv`: 10 件で $120.89、5 件で $79-90) で、原因はサブエージェントが
CLAUDE.md+rules ≈150K トークンを毎ターン読みながら 46-144 ターン回ることにある。モデルを変えても
1 桁しか変わらない。

解は **Agent tool を使わないこと**。`generate-parallel.ts --model claude-sonnet --critic claude-sonnet` は
headless `claude -p` を子プロセスで呼ぶ。prompt は約 5,000 字 (dry-run 実測)、rules 読込なし、
ツールループなし。実装上の約束:

| 項目 | 内容 |
|---|---|
| 入口 | `bash .claude/scripts/ai-content/run-claude-batch.sh` (**ユーザー端末で実行**。Claude Code セッション内は Keychain を読めず「Not logged in」になる・実測 2026-09-05) |
| lean 化 | cwd を repo 外に固定 (CLAUDE.md / `.claude/rules` / project hooks / `.mcp.json` を読ませない)、`--tools ""`、`--strict-mcp-config`、`--no-session-persistence`、`--setting-sources local` (user hook `sync-memory.sh` を毎 call 走らせない・実測で抑止確認)、独自 `--system-prompt`、子 env から `CLAUDE_*` を除去 (継ぐと Keychain を読まず「Not logged in」)。`--bare` は OAuth 不可なので使わない |
| 費用を決める 2 つ | **author は `--json-schema` を使わない** (構造化出力は CLI 内部が 2 ターンになり input 4.3K → 32K。構造は監査が見る)。**`--effort low` 既定** (同一 prompt・Sonnet 5 で $0.54/148 秒/出力 19.7K → $0.23/69 秒/7.5K。`MAX_THINKING_TOKENS=1024` は $0.33)。critic だけは `--json-schema` を使う (schema なしだと section 欠落や平文が返り parse 失敗で author 分が無駄になる。出力 ~1K なので追加 ≈$0.02) |
| model alias | `claude-haiku` / `claude-sonnet` / `claude-opus` の allowlist のみ (`claude-cli-output.ts`)。typo が黙って haiku に倒れない |
| 品質ゲート | Gemini 経路と同一: `audit-ai-content.mjs` (機械フロア) → 別プロセスの Claude critic (`buildGeminiCriticPrompt` / `parseGeminiCriticVerdict` を transport 非依存で流用) → REVISE は 1 回再生成。**ゲートは緩めない** |
| 公開 | outbox → **1 push = 1 commit ≤ 35 件** → develop → `publish-ai-content.yml` (人間 / セッションの push は発火する)。公開確認は R2 の内容一致で行う |
| 記録 | `--output-format json` の usage / `total_cost_usd` を `history.csv` (`cost_usd` 列・末尾追加) と report に残す。inputTokens は cache を含む合算 = **1 request で 40K を超えたら rules が漏れ込んでいる**合図 |
| quarantine | `failed` に載せるのは `status=rejected` (ゲート / critic 落ち) のみ。skip や CLI 障害・429 を数えると 3 run で大量 quarantine になる |
| 分業 | author / critic = **Sonnet 5** (`--effort low`)。Haiku 4.5 は pilot 1 で **0/10** (括弧数値 4・数値範囲外 3・JSON 崩れ 1・京都府を中部に置く等の事実誤り) で author 不適。**Opus 5 は manual-escalation 30 件 + quarantine のみ** Agent tool 経由。量産に Opus を使わない |
| 運転設定 | `--model claude-sonnet --critic claude-sonnet --retries 1 --concurrency 2 --limit 35` (= `run-claude-batch.sh` 既定)。verify1 実測: 6/6 通過 (1 回目 4・2 回目 2)、**$0.51/件・43K トークン/件・6 件 8 分** |
| 不変 | Claude を CI cron で無人実行しない。量と時期は人が決める (月次 / 週次計画) |

**pilot 0 実測 (2026-09-05・`library-count-per-million`・Sonnet 5 author+critic・1 回目 PASS)**:
author prompt 4.7K トークン (10,250 字) / 出力 7.4K / $0.238、critic 2 ターン 14K / 出力 1K / $0.111 →
**1 件 27K トークン・$0.35 (API 換算)**。Agent tool 経路の $12-17/件 (10 件 $120.89) の約 1/35〜1/50。
history.csv の run `local-20260905-*` に author/critic request 数・トークン・`cost_usd` が残る。

**通過率は author prompt で上げた (ゲートは触っていない)**。同 key は改修前に critic REVISE を 3 連続で受けて
REJECT だった。critic の指摘は正当で、原因は prompt の内部矛盾: insights の例に「地方ブロック間の平均値比較」を
挙げていたため regionalAnalysis の結論をなぞる / ですます調の指定が無かった / 県別解説が 43-59 字と規定の
60-120 字を下回っていた。`ranking-content-prompt.ts` を直し (insights は全国横断の分布に徹し regionalAnalysis を
繰り返さない・全セクションですます調・commentary は 2 文で 60 字以上・47 件で文型を変える)、次の 1 回で PASS。
REJECT した候補と critic 指摘は `.local/ci/rejected/<key>-<ts>.json` に残る (公開しない) ので、落ちたら
まずそれを読んで prompt 側を直す。

**pilot 1 → verify1 (2026-09-05)**: Sonnet 9 件は 4/9 (全て 2-3 回目・$1.04/件) で、critic REVISE 15 回中 10 回が
prefectureCommentary だった。dump を読むと原因は 2 つ: (a) **文字化け** — 子プロセス stdout を chunk ごとに
`toString()` していて「滋賀県」が「��賀県」になっていた (transport のバグ・`createUtf8Collector` で修正、
再現テストあり) (b) **定型化** — prompt が 47 件すべてに同じ 3 要素を義務づけていた (視点を県ごとに
入れ替える指示へ変更)。両方入れた verify1 は落ちた 5 件 + 1 件で **6/6 (1 回目 4・2 回目 2)、$0.51/件**。
critic の指摘は毎回正当だった (事実誤り・文字化け・反復)。**critic を緩めずに author 側を直す**のが正しい順序。

**batch1 → batch2 → verify2 (2026-09-05 午後)**: batch1 (35 件・concurrency 2) は 9 件処理 (OK 6) の後 **26 件が
`CLI failed (code 1)` で即失敗**。stderr が空で原因を残せなかった (非ゼロ終了時に stdout の wrapper を捨てる
実装の欠陥 → 修正済み。次に起きれば `claude-<subtype>: <message>` として残る)。batch2 (concurrency 1) は 16 件で
OK 8 / REJECT 8、REVISE 11 回中 8 回が「県別解説の定型化」MAJOR。dump を読むと critic は **author が禁止されている
外部知識に基づく「県固有の読み解き」を要求**しており、実物は隣接県対比・地方内位置などデータ由来の固有性を
持っていた。一方で FAQ の平均超え県数の誤集計 (2 件) と「地方内で最も低い」の 2 県矛盾は本物の誤りだった。対処:
(a) prompt に「平均を上回る県 N / 下回る県 M」と「地方別の順位表」を機械計算で与える (数えさせない)
(b) author に書き出しの回し方 (地方名で始めるのは 12 件以下) と 2 文 60-100 字を指示
(c) **critic に author の制約を前提として書く** (施設名・政策名・制度名・企業名は禁止だが一般的な地理の言及は可・
誤りは MAJOR / 定型化は「着眼点の組み合わせも文構造も同じ解説が半数超」のときだけ MAJOR / regionalAnalysis に
登場しない県があるのは規定どおりで矛盾ではない)。これは critic の**判定基準の明文化**であり、事実誤り・文字化けは
従来どおり MAJOR / BLOCK。verify2 (batch2 で落ちた 8 件・`--retries 1`) は **4/8、$0.67/件**。残った MAJOR は
すべて事実誤り (静岡・長野を日本海側と書く等) で、定型化は全件 MINOR に降格した。

**定常値 (2026-09-05 時点)**: 一次通過率 ≈50%、**公開 1 件あたり ≈$1.3 API 換算・≈95K トークン** (旧 Agent tool
経路 $13.6・586 万トークン)。落ちた key は次回のキューが再ピックし、3 連続で quarantine → Opus 例外是正。

#### 履歴: 2026-08-21 に Claude 日次 CI を廃止した理由

**`ai-content-generate-daily.yml` を削除した。** Claude Code を CI で無人実行する日次ループは
対話セッションと同じ Pro/Max 利用枠を食う。歩留まりが崩れた時点で、枠だけ削って成果が出ない
構図になっていた (`.claude/state/metrics/claude-usage/history.csv` の実測):

| 日 | limit | items | turns | cost |
|---|---:|---:|---:|---:|
| 08-15〜08-18 | 5 | 5 / 5 / 5 / 5 | 47〜98 | $79〜$90 |
| **08-19** | 5 | **0** | 57 | $87.31 |
| **08-20** | 5 | **1** | 27 | $21.33 |

08-20 の run は `rate_limit_event: 1` を記録し、turns も cost も平常の 1/3 で途中終了した
(最終メッセージ「I'll wait for it to complete before proceeding」)。

**当時の暂定運用** (現在は 2026-08-30 の Gemini 日次 CI が正典):

1. **月次計画 (`.claude/todo/monthly.md`) が月間の本数目標を持つ。** 対話セッションの
   1 件あたり消費は測っていないので、控えめに置いて翌月に実績で見直す。
2. **週次計画 (`.claude/todo/weekly.md`) が「今週 N 件」を Must として割り当てる。**
   未達を翌週へ積み増さない (Must が形骸化するため)。足りなければ月次の目標側を下げる。
3. 生成は対話セッションが `/generate-ai-content` で行う。キュー
   (`build-ai-content-queue.mjs --next N`) が対象を出し、`audit-ai-content.mjs` が機械の床、
   `ranking-content-critic` が意味レビューを担う。
4. **push すれば公開される。** `data/ai-content-staging/<key>.json` を develop へ push すると
   `publish-ai-content.yml` が push トリガーで発火し、R2 反映前に
   `audit-ai-content.mjs` を再実行する。CI の既定 `GITHUB_TOKEN` による push は
   後続 workflow を発火させないが、人間 / セッションからの push は発火する。

**当時は critic PASS の機械強制が無くなった。** CI は `.local/ci/ai-content-reviews/<key>.json` の
`verdict == PASS` を照合していたが、これは CI 専用パスで publish 側に無い。blog と違い
ai-content には `review.md` 相当の永続成果物が無い。**critic を通してから push すること**を
`/generate-ai-content` の手順で担保する。機械の床 (`audit-ai-content.mjs`) は publish 側に
残るので、捏造・NG ワード・欠落は引き続き止まった。現在は Gemini critic の PASS も生成スクリプト内で強制する。

以下は 2026-07-30〜07-31 の旧 Gemini 運用の記録。配送・429・preflight の教訓は現行実装に引き継ぐが、件数・モデルは上の現行契約が優先する。

### (撤去済) 全件量産の日次ループ (Gemini・2026-07-30〜2026-07-31)

Claude のトークンを使わず全 active ranking (実測 2,179 件) を完成させるための無人ループ。
**`.github/workflows/ai-content-generate-daily.yml`** (JST 03:00) が以下を回す:

```
モデル preflight (極小の実生成で使用可否を確認)
  → キュー再構築 (--scope all) → needs-regen 上位 N → Gemini API 生成 (--model gemini-api)
  → 決定的ゲート → outbox (--outbox) → develop へ push
  → publish-ai-content.yml を dispatch (gate 再検証 → R2 → CDN purge → outbox 削除)
  → キュー再構築して進捗を commit-back
```

**★outbox の配送は push トリガー任せにしない (2026-07-31 実測)**。GitHub Actions は
**既定の `GITHUB_TOKEN` で push した場合、後続 workflow を発火させない**(無限ループ防止の仕様)。
日次 cron の commit-back は既定トークンで push するため、`publish-ai-content.yml` の
push トリガーは**発火しない**。初めて生成が成功した回に 2 件が outbox へ滞留してこれが露見した
(生成が常に 0 件だったため、それまで一度も露見しなかった)。日次 cron は `actions: write` を持ち
**明示的に dispatch し、run が生まれたことを実測してから成功**とする。push 失敗も握り潰さない。

| 要素 | 実装 |
|---|---|
| 生成 | `--model gemini-api` (`packages/ai-content/src/services/gemini-text-client.ts`)。**CLI 非依存**。CLI (`--model gemini`) は認証・バージョンが実行環境に依存するため CI では使わない |
| 認証 | `GEMINI_API_KEY` (GitHub Secrets 専任。画像生成と共用) |
| **モデル** | 既定は `gemini-text-client.ts` の `GEMINI_TEXT_MODEL`。**リポジトリ変数 `GEMINI_TEXT_MODEL` で上書きできる** (提供終了時にコード変更 + デプロイを待たず復旧するため) |
| 件数上限 | 既定 40 = `publish-ai-content.yml` の `MAX_PUBLISH` と同数。超過分は次回に繰り越す。**★この 40 はクォータ実測に基づいていない** (下記) |
| 失敗の扱い | 429/5xx/timeout は client がバックオフ再試行 (429 は 15s 起点)、`truncated`/4xx は再試行しない |
| 費用 | flash 系に無料 tier があるが、**キーが有料課金に紐づく場合は 1 件あたり入力 ~5K / 出力 ~8K トークン相当が課金される**。件数で管理する |

#### ★件数はクォータ実測で決める (2026-07-31 に矛盾が判明)

**既定 40 件/日はクォータを測らずに置いた数字で、成り立つ保証がない。**

実測: 01:58 UTC の dispatch で 10 件生成に成功した後、**3 時間後の 04:56 / 05:15 UTC に
preflight が 429** で落ちた。1 日 10 件強で枯れているなら 40 件は成立しない。ブログ生成
(1 記事 = 本文 + critic の 2 回) も同じキーを共有するので、先に走った方が後を枯らす。

原因を切り分けられなかったのは、client が **429 の本文を丸ごと読み捨てていた**ため。
安全のため本文をログに出さない規律は正しいが、そのせいで「分あたりで詰まったのか、
日あたりを使い切ったのか」「上限がいくつか」が一切見えなかった。

→ `extractQuotaDetails` を追加し、**構造化された 3 項目だけ**を取り出して preflight が出す
(`quotaMetric` / `quotaValue` / `retryDelay`)。自由文もキーも触らない。次の 429 で実測値が出る。

**実測が出るまで件数を上げない。** 40 と 2 は暫定値で、`quotaValue` を見てから
「ai-content と blog の合計が 1 日の上限に収まる」ように配分し直す。

#### ★429 には対処が正反対の 2 種が同居する (2026-07-31 に本文を実測)

本文を出して分かったのは、**この 429 はレート制限ではなかった**ということ:

```json
{ "error": { "code": 429, "status": "RESOURCE_EXHAUSTED",
  "message": "Your prepayment credits are depleted. Please go to AI Studio ... billing." } }
```

| 429 の種類 | 意味 | 正しい対処 | 誤った対処 |
|---|---|---|---|
| レート制限 (RPM/RPD) | いま混んでいる | 時間をおいて再実行 | — |
| **前払いクレジット枯渇** | **課金が尽きた** | **人がクレジットを補充する** | 待つ / モデルを変える (どちらも効かない) |

`error.details` が無いので `extractQuotaDetails` が undefined を返したのは**パーサの不具合ではない**。
Google はこのクラスで構造化 quota を返さず、判別材料は `error.message` の自由文しかない。

- クライアントは `isBillingExhausted` で 429 を 2 分し、`billing` は **再試行しない**
  (人が補充するまで同じ 429 が返るので、15s→30s→60s の待ちは純粋な浪費)。
- preflight も分けて案内する。分ける前は「時間をおいて再実行」「lite 系候補で回避できる」と
  出していたが、**課金はプロジェクト単位なのでモデルを変えても同じ 429 が返る**。効かない回避策を
  出さないことをテストで固定した。
- 判定は狭く取る (`credits are depleted` 等)。`billing` の語だけで見るとレート制限本文の
  「billing を有効にすると上限が上がる」案内で誤爆する。迷ったら rate-limit のままにする。

**preflight の終了コードで「壊れている」と「判定できなかった」を分ける**:

| exit | 意味 | PR gate (`ai-content-preflight.yml`) | 日次 cron |
|---|---|---|---|
| 0 | モデルが使える | pass | 生成へ進む |
| 1 | **モデルが使えない** (提供終了・権限) | **fail** (この gate の本来の目的) | 停止 |
| 3 | **判定不能** (クレジット枯渇・レート制限) | warning で pass | 停止 (生成できないので) |

exit 3 で PR を止めると、モデルが健全でも課金が尽きている間は該当ファイルに触る PR が
すべて通らなくなる。**モデルまで到達していないのに「モデルが壊れている」と報告するのは、
合格を装うのと同じくらい誤り**なので、判定不能は判定不能として出す (止めるかは呼び出し側が決める)。

**したがって「1 日何件回せるか」はまだ実測できていない。** クレジット補充後に初めて
`quotaValue` が観測できる。40 / 2 は依然として根拠のない暫定値。

#### ★モデル提供終了と silent green の再発防止 (2026-07-30 の障害)

日次 cron の初回実行は **40 件すべて HTTP 404** で失敗し、生成 0 件で終わった。原因はキーでも
配線でもなく「設定モデルが API に存在しない」ことだった。しかも `generate-parallel.ts` が
全件失敗でも exit 0 を返すため **workflow は success** となり、毎晩失敗し続けても気づけなかった。
モデルは提供終了するので、コードに焼いたモデル名はいつか必ず 404 になる。二重に守る:

| 層 | 実装 | 効果 |
|---|---|---|
| ① 事前 (preflight) | `packages/ai-content/src/scripts/preflight-gemini.ts` — **極小の生成を 1 回試す**。落ちたときだけ ListModels を呼び候補付きで exit 1。日次 cron の生成前 step + `ai-content-preflight.yml` (モデル設定に触る PR) | 全件 404 を「生成前に 1 回」で止める |
| ② 事後 (exit gate) | `packages/ai-content/src/services/generation-outcome.ts` の `decideOutcome` — **1 件も出せなければ exit 1**。部分的な失敗 (OK ≥ 1) は成功扱いで運用を止めない | 原因を問わず「何も出ていない」を必ず赤くする |

**★ListModels に載っていることは「使える」証明にならない (2026-07-31 CI 実測)**。preflight を最初
ListModels の一覧照合だけで作ったところ、`gemini-2.5-flash` は**一覧に載り
`supportedGenerationMethods` に `generateContent` を持つのに、実際に叩くと 404** だった。
一覧は代理指標にならず、そのゲートは壊れたパイプラインを素通りさせる。**合否は実生成でだけ判定する**
(一覧は失敗時の候補出しにのみ使う)。

**モデル選定 (2026-07-31 に `gemini-2.5-flash` → `gemini-3.5-flash`)**: 既定は **pinned なモデル名**にする。
`gemini-flash-latest` のような浮動 alias は 404 を避けられる代わりに**品質もコストも黙って変わる**。
提供終了は preflight が実生成で必ず検出するので、pinned でも気づけないまま止まることはない。
lite ではなく flash (47 県の解説を書かせるため)、preview / experimental は使わない。

候補は**提案であって自動選択ではない** (勝手に別モデルへ切り替えると品質もコストも黙って変わる)。
復旧はリポジトリ変数 `GEMINI_TEXT_MODEL` に実在モデルを設定するか、`GEMINI_TEXT_MODEL` 既定値を更新する。

**HTTP status での切り分け** (実測 2026-07-30): 無効キーは **400** (`API_KEY_INVALID`) を返す。
したがって **404 が出たらキーではなくモデル名**を疑う。400 / 401 / 403 のときはキーか
Generative Language API の有効化を確認する。

**進捗管理**: `build-ai-content-queue.mjs --scope all` が実行のたびに
`.claude/state/ai-content/progress-history.csv` へ 1 行追記し (同日同 scope は上書き)、
`LATEST.md` に **消化ペース (件/日) と完了見込み日数**を出す。R2 が真実源でキューは毎回再導出する
派生ビューなので、中断・再開しても状態がずれない。

```bash
node .claude/scripts/ai-content/build-ai-content-queue.mjs --scope all       # 全件スコープで再構築
node .claude/scripts/ai-content/build-ai-content-queue.mjs --no-build --next 40  # 次バッチの key 一覧
```

`--scope gsc` (既定) は GSC 流入のあるページに絞った SEO 優先母集団で、**深掘り (brushup) の対象選定**に使う。
`--scope all` は**全件完成フェーズ**用。どちらも同じ done 判定 (auditRow) を使うので混在しても矛盾しない。
- 「次に何を生成するか」の真実源は **ai-content 是正キュー** (`build-ai-content-queue.mjs` → `.claude/state/ai-content/`)。
  高流入 incomplete 優先。done は R2 の auditRow 通過で毎回再導出 (R2 が真実源・キューは派生)。

## Agent 分業

| 工程 | 担当 | 成果物 |
|---|---|---|
| 仕様・基準設計 / effect 判定 | ranking-content-author / improvement-triage | 仕様・判定 |
| 日次解説生成 | Gemini API author (`gemini-2.5-flash-lite`) | ai-content.json 候補 |
| 日次意味レビュー | 別リクエストの Gemini critic | PASS / REVISE JSON |
| quarantine ・高流入キーの例外是正 | `ranking-content-author` + `ranking-content-critic` | ai-content.json・手動レビュー |
| 数値照合・文字数床・リンク数 | 決定的スクリプト (audit-ai-content.mjs) | gate 結果 |

- トークン原則: 1 ページ = author 1 call + critic 1 call。REVISE 時だけ最大 2 call を追加。

## リスクと対処

| リスク | 対処 |
|---|---|
| AI 量産文の thin/doorway 判定 | パイロットで順位悪化も監視。下落時は即 rollback (R2 旧 ai-content 上書き push) |
| BLOG-WAVE と計測期間が重複し効果分離不能 | ranking と blog は URL 種別が違うため GSC page filter (`/ranking/`) で分離集計 |
| CTR 改修の seoTitle が検索意図とズレ pos 下落 | Head 層は 1 件ずつ query レポート確認後に改修 (一括禁止) |

## 関連

- 戦略・KPI: `docs/00_プロジェクト管理/03_マーケティング戦略.md`（T1〜T4・SEO品質レバー）
- ai-content 是正キュー: memory `project_ai_content_remediation_queue` / `.claude/scripts/ai-content/build-ai-content-queue.mjs`
- 決定的ゲート: `.claude/scripts/ai-content/audit-ai-content.mjs` (生成物) /
  `.claude/scripts/ai-content/lib/value-health.mjs` (接地データ)。テストは
  `.claude/scripts/ai-content/__tests__/*.test.mjs`、CI 配線は `pr-quality-check.yml` の AI Content Gate Guard
- 生成 0 件ゲート: `packages/ai-content/src/services/generation-outcome.ts` (`src/services/__tests__/` にテスト)
- セッション側の入口: skill `/generate-ai-content` (agent: `ranking-content-author`) / prompt 取得: `build-input.ts --prompt-only`
- 公開: `.github/workflows/publish-ai-content.yml` (自動化インベントリ参照)
- agent: `ranking-content-author` (生成) / `ranking-content-critic` (審査) / `ranking-publisher` (公開) / `ranking-ui-manager` (UI)
- 関連 rule: `.claude/rules/metric-config-standards.md` (title/seoTitle) / `blog-quality-standards.md` (ですます調・archetype A) / `evidence-based-judgment.md`
