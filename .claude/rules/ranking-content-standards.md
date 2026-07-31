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
node --test .claude/scripts/ai-content/__tests__/number-audit.test.mjs       # ゲート自体のテスト
```

values.json が取得できない場合は照合をスキップする (fail-open) が、**スキップしたことを出力に明示する**
(合格と誤読させない)。

## 生成パイプライン (完全DBレス)

```
R2 values.json + correlation + metric config
  → 生成 (既定はローカル CLI npm run ai:gen。トークン規律は TOKEN-AICONTENT-01)
  → 決定的 gate (audit-ai-content.mjs。落ちたら同じ prompt で再試行 --retries、既定 1 回)
  → critic (ranking-content-critic) 監査 → review.md
  → R2 app/ranking/<key>/ai-content.json (CI push: publish-ai-content.yml、develop push で発火)
```

**公開までの受け渡しは 2 経路あり、実行環境で選ぶ** (混同すると生成物が公開に到達しない):

| 実行環境 | 出力先 | 公開手段 |
|---|---|---|
| R2 creds あり (ローカル / CI) | `.local/r2/app/ranking/<key>/ai-content.json` (既定) | `diff-push-r2 --prefix app/ranking` |
| **creds なし (クラウドセッション / Routine)** | `data/ai-content-staging/<key>.json` (`--outbox`) | develop へ push → `publish-ai-content.yml` が gate → R2 → CDN purge → outbox 削除 |

outbox は**フラットな `<rankingKey>.json`** でなければならない (workflow の検出 glob が
`data/ai-content-staging/*.json` なので `app/ranking/<key>/` 配下に置くと拾われない)。
`--out data/ai-content-staging` では階層が付くため公開されない → **`--outbox` を使う**。

- blog の `quality-gate.mjs` / blog-critic / `review.md` モデルを流用 (実装パターン再利用・drift 防止)。
- スクリプト配置は `.claude/scripts/ai-content/` (`skill-code-placement.md` 準拠)。R2 書き込みは CI 専用 (`r2-storage-design.md`)。
- **安いモデルで数をこなす方針** を採る場合、品質は「モデルを賢くする」ではなく
  「決定的ゲート + 再試行」で担保する。`--retries N` は JSON 崩れ・ゲート落ちを同じ prompt でやり直し、
  **ゲートを緩めて通すことは絶対にしない** (品質ではなく実行時間で払う)。落ち率はモデルを変えたら
  必ず実測する (10 件パイロット → blocker 内訳を確認 → 落ち率が高ければプロンプト側を直す)。

### 全件量産の日次ループ (Gemini・トークン消費ゼロ・2026-07-30 新設)

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
| 仕様・基準設計 / サンプル監査 / effect 判定 | Fable / improvement-triage | 仕様書・判定 |
| パイプライン実装・factual gate | Opus | スクリプト |
| 解説文生成・GSC 集計・内部リンク監査 | `ranking-content-author` (Sonnet/haiku) | ai-content.json・集計 |
| 意味レビュー (重複/読者価値/トーン) | `ranking-content-critic` | review.md |
| 数値照合・文字数床・リンク数 | 決定的スクリプト (audit-ai-content.mjs) | gate 結果 |

- トークン原則: 1 ページ生成 = 1 call + critic batch (10 件単位)。

## リスクと対処

| リスク | 対処 |
|---|---|
| AI 量産文の thin/doorway 判定 | パイロットで順位悪化も監視。下落時は即 rollback (R2 旧 ai-content 上書き push) |
| BLOG-WAVE と計測期間が重複し効果分離不能 | ranking と blog は URL 種別が違うため GSC page filter (`/ranking/`) で分離集計 |
| CTR 改修の seoTitle が検索意図とズレ pos 下落 | Head 層は 1 件ずつ query レポート確認後に改修 (一括禁止) |

## 関連

- 戦略・KPI: `docs/00_プロジェクト管理/03_マーケティング戦略.md`（T1〜T4・SEO品質レバー）
- ai-content 是正キュー: memory `project_ai_content_remediation_queue` / `.claude/scripts/ranking/build-ai-content-queue.mjs`
- 決定的ゲート: `.claude/scripts/ranking/audit-ai-content.mjs`
- モデル preflight: `packages/ai-content/src/scripts/preflight-gemini.ts` + `src/services/model-preflight.ts` / 生成 0 件ゲート: `src/services/generation-outcome.ts` (いずれも `src/services/__tests__/` にテスト)
- 公開: `.github/workflows/publish-ai-content.yml` (自動化インベントリ参照)
- agent: `ranking-content-author` (生成) / `ranking-content-critic` (審査) / `ranking-publisher` (公開) / `ranking-ui-manager` (UI)
- 関連 rule: `.claude/rules/metric-config-standards.md` (title/seoTitle) / `blog-quality-standards.md` (ですます調・archetype A) / `evidence-based-judgment.md`
