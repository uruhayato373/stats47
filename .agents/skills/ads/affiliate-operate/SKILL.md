---
name: affiliate-operate
description: A8 / もしも / afb の 3 ASP を横断して提携状態を実機と照合し (status)、提携申請を dry-run→commit で送り (apply)、afb の未提携案件を走査する (scan)。3 ASP とも stats47 と doboku-note が同一口座に同居するため、全操作でサイト帰属 assert を通し不一致は例外で停止する。Use when user says "提携状況を確認", "ASP 横断で比較", "提携申請", "afb を調べる", "もしもを調べる", "affiliate-operate".
disable-model-invocation: true
primary_agent: affiliate-operator
co_agents: [affiliate-manager]
---

3 ASP の**提携運用** (状態照合 / 申請 / 走査) を回す。ローカル限定 (Playwright 永続プロファイル)。
Mac / Windows 双方で動く。

> **正典は `.claude/rules/affiliate-ads-standards.md` §11**。本 skill は手順のみ。
> 接続設定は `.claude/config/affiliate-asp.json`、提携台帳は `.claude/state/ads/affiliate-catalog.json`、
> サイト帰属の判定は `.claude/scripts/ads/lib/asp-site-guard.mjs` が SSOT。
> A8 の**案件開拓**は `/scout-asp`、A8 の**成果取込**は `/a8-report` が担当 (役割が違う)。

## モード

| mode | コマンド | 副作用 |
|---|---|---|
| `status` (既定) | `node .claude/scripts/ads/affiliate-status.mjs [--asp a8,moshimo,afb]` | なし (read-only) |
| `status --write` | 同上 `--write` | カタログ JSON を実機値で更新 |
| `apply` (dry-run) | `node .claude/scripts/ads/affiliate-apply.mjs --asp <moshimo\|afb> --id <id>` | plan を書き出す (押さない) |
| `apply --commit` | `同上 --plan <operationId> --commit` | **提携申請を送信 (不可逆・要オーナー承認)** |
| `scan` (afb) | `node .claude/scripts/ads/afb-scan.mjs [--vertical <軸>] [--mode search\|crawl]` | なし (走査 JSON を .local に出力) |
| `scan` (もしも) | `node .claude/scripts/ads/moshimo-scan.mjs [--query <語>] [--vertical <軸>]` | なし (同上) |
| `harvest` (afb) | `node .claude/scripts/ads/afb-harvest.mjs --id <PID[,PID]>` | なし (原稿を `.local/affiliate-harvest/afb/` に保存。SSOT 登録・公開は別工程) |
| `budget` | `node .claude/scripts/ads/check-asp-apply-budget.cjs --asp <moshimo\|afb>` | なし (週の残枠を表示) |

## 手順

### 0. 前提の確認 (初回のみ人間)

各 ASP に手動ログインして永続プロファイルを作る。**認証情報は agent が扱わない。**

- A8: `node .claude/skills/ads/scout-asp/scripts/login.mjs`
- もしも / afb: `affiliate-status.mjs` 実行時にブラウザが開くので、その場で人間がログインする
  (ログイン待ちのティッカーが出る。最大 10〜15 分)

### 1. status — 実機とカタログを突合する

```bash
node .claude/scripts/ads/affiliate-status.mjs
```

- 各 ASP の提携中 / 申請中一覧を読み、`affiliate-catalog.json` の `status` と比較してドリフトを出す。
- **取得できなかった ASP は「判定不能」として区別される。** これを「提携なし」と読み替えない。
  **A8 は抽出パターンが無く常に ID 0 件**になる (A8 の提携状態は `/scout-asp check-approval` で見る)。
- 反映するときだけ `--write` を付ける (既定は read-only)。`--write` は正遷移の反映に加えて
  **name の補完**も行う (placeholder のみ上書き。既存の名前は壊さない)。
- ログ: `.local/affiliate-status/status.log`

**出力で必ず確認すること (2026-08-04 の事故を受けて機械化済み)**

| ログ | 意味 | 対応 |
|---|---|---|
| `一覧 N 件 / ID 累計 N 件` が**一致** | スコープが一覧行に限定できている | 正常 |
| `⚠ 一覧 N 行 に対し ID M 件 (差 X)` | 超集合 or 取りこぼし | `affiliate-asp.json` の `listScopeSelector` を実機で調べ直す |
| `⚠ 提携中と申請中の両方に出る ID N 件を除外` | ページ共通リンクが混入している | 除外は自動。頻発するならスコープ設定が誤っている |
| `名前と ID の index 対応が検証できず…` | 既知名と照合が通らなかった | 名前補完はスキップされる (捏造しない)。順序ズレを疑う |

`⚠` が出た状態の `--write` は**幻や誤った名前を台帳に焼き込むおそれがある**ので、
スコープを直してから反映する。

### 2. scan — afb の未提携案件を掘る

```bash
node .claude/scripts/ads/afb-scan.mjs --vertical travel,economy
```

- 既定は検索モード (全件クロールは遅いため)。`--mode crawl --max-pages N` で深掘りできる。
- 抽出語は stats47 の 10 vertical (`VERTICAL_KEYWORDS`)。当たりを付けるための広めの語彙で、
  **最終的な vertical 判定は登録時に人/agent が行う**。
- 結果 JSON: `.local/playwright-afb-debug/scan-<rel>-<runId>.json`
- crawl モードで全件を見ていない場合は「ヒット 0 件」を「該当なし」と読まない (警告が出る)。

### 3. apply — 提携申請する

```bash
# 1. dry-run。押せる状態かを確認し、plan を .local/affiliate-ops/plans/ に書き出す
node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --id 6154
#    → 出力の `plan: moshimo-6154-<timestamp>` が operationId

# 2. オーナー承認を得てから、その plan だけを実行する
node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --plan moshimo-6154-<timestamp> --commit
```

- **★`--commit --id` は使えない (exit 2)。`--commit` は `--plan` 必須**。id 直指定だと
  「見た画面」と「押す画面」が別 run になり、間の差し替えを検知できないため
  (doc 42 §6.3 / `affiliate-ads-standards.md` §11)。
- plan は **24 時間で失効**する。期限切れ・画面が変わっている場合は押さずに失効させるので、
  dry-run からやり直す。
- 同じ plan を 2 度は実行できない。journal に `sent` が残っている operation は
  自動再送しない (二重申請の防止)。状態を知りたいときは `affiliate-status` で実機を見る。

- **`--commit` は外部への不可逆送信 (規約同意を伴う)。オーナーの明示承認なしに実行しない。**
- **週上限がある** (config `asps.<name>.weeklyApplyMax`。現在 100 — 2026-07-28 にオーナー判断で 10→100)。
  残枠を超える件数を指定すると実行前に落ちる。**これは ASP の公表値ではなく自分たちで置いた歯止め**。
  現在値は config が正で、この文書に固定しない。
- Red Line 案件 (`redLine: true`) は `--commit` でも申請前に落ちる。
- 「一括提携申請へ」は候補から機械除外される (押すと画面上の全案件を一度に申請してしまうため)。
  もしもは加えて**フォームの申請対象数が 1 件でなければ押さない** (申請ページの見出しが
  「プロモーション 一括提携申請」で、ラベルだけでは単一/一括を判別できないため)。
- もしもの申請フォームのサイト select は read-back 確認を通らなければ押さない。
- **もしもの申請は 2 段階**。申請ページ →`/apply/confirm` で「このメディアで提携する」を押して確定する。
  1 段目で止めると成立しない。
- **完了判定は文言ではなく実測**。申請中一覧に当該案件が現れて初めて `applied` と記録する。
  現れなければ `unverified` として dump を残す (2026-07-28 に文言判定で 4 件を誤報した)。
- **もしもは即時承認があり、申請中を経ず提携中へ直行する**。申請中一覧だけを見ると
  成立した申請を `unverified` と誤報するので、**提携中一覧も確認する** (2026-07-28 に 4 件実測)。
- 完了確認の href 照合は `listScopeSelector` の一覧行スコープで行う (175763c61)。
  ページ全体から拾うと、ページ共通リンク (`promotion_id=7630 / 7556 / 170`) と同じ番号の案件を
  申請したとき、成立していなくても「申請完了」と誤報する。
- 申請が確認できた案件は台帳 `affiliate-catalog.json` に **エントリが無ければ作って**記録する
  (`status: applying` + `history`)。
- A8 の申請は本 skill の対象外 → `/scout-asp` (別の週次上限ガード付き)。

### 4. ASP 間比較 → 運用先を 1 つに寄せる

カタログの `programs[].asps` に単価・確定率・EPC が揃ったら比較表を出す。
同一案件を複数 ASP で並行運用すると成果の帰属が割れて EPC 集計が二重管理になるため、
**判断材料の多い ASP に寄せる** (もしもは承認率・EPC を非公開)。決定は `decision` に理由付きで残す。

## 別 PC で続けるとき (何が引き継がれ、何が引き継がれないか)

git で運ばれるもの / 運ばれないものを取り違えると、重複申請やログイン迷子になる。

| 引き継がれる (git) | 引き継がれない (マシン固有) |
|---|---|
| 提携台帳 `.claude/state/ads/affiliate-catalog.json` (申請履歴・週上限の入力) | **Playwright 永続プロファイル `.local/playwright-*-profile`** (gitignore) |
| A8 カタログ `.claude/state/ads/a8-catalog.json` (状態機械・承認待ち) | セッション state `.local/playwright-*-state.json` |
| 接続設定 `.claude/config/affiliate-asp.json` (URL / ラベル / 週上限) | 走査結果 `.local/playwright-*-debug/` (再実行すれば作れる) |
| 広告 SSOT `apps/web/scripts/affiliate-ads-data.ts` | — |

- **初回は各 ASP へ人間が手動ログインする**。認証情報は config にも env にも置かない規約なので、
  新しい PC では必ずログインし直しになる (`status` 実行でブラウザが開き、その場で人がログインする)。
- **週の申請上限は台帳の history から数える**ので、PC をまたいでも正しく効く
  (`check-asp-apply-budget.cjs --asp moshimo`)。移動直後にまず残枠を確認する。
- **Windows では実 Chrome の起動が落ちる**ことがある (企業端末で実測)。同梱 chromium へ
  自動フォールバックするので操作は不要だが、ログは残る。

## 継続運用の残課題

A8 は `scout → apply → check-approval → harvest → register → 公開` が閉じている。
afb は承認追跡と広告原稿のローカル取得まで実装済み、もしもは apply までである。

| 工程 | A8 | もしも / afb |
|---|---|---|
| 案件探索 | `scout` | ✅ `moshimo-scan` / `afb-scan` |
| 申請 | `apply --id` | ✅ `affiliate-apply --plan … --commit` |
| **承認の追跡** | `check-approval` (週次で applied→approved) | ✅ `affiliate-status --write` (実機照合で applying→approved。名前も補完する) |
| **広告コード取得** | `harvest` | afb=`afb-harvest.mjs --id ...` / もしも=未実装 |
| SSOT 追記 | `append-affiliate-ads` | afb/もしもとも手動登録のみ |
| 定期実行 | 週次 cron | ❌ 手動のみ |

- **承認追跡は 2026-08-04 に埋まった**。`affiliate-status --write` が正遷移を反映するので、
  もしも / afb の承認が申請中のまま放置されることは無くなった (同日の照合で承認 17 件を反映)。
- **残る断絶は、afb では「取得済み原稿のSSOT登録」、もしもでは「広告コード取得」**。
  afb の harvest は PID 明示・approved・stats47 SID read-back・PID/name binding・canonical サイズ・
  クリック URL + lead pixel の完全性を満たす場合だけローカル保存する。登録・公開は別承認で行う。
- ただし**登録を増やせば収益が増えるとは限らない**。同一 vertical × 枠は banner 上位 1 +
  text 上位 2 しか表示されず、在庫 260 件に対し 28 日で impression が付いたのは 84 件だけ
  (2026-08-04 実測)。もしものharvestやSSOT登録自動化を広げる前に、計装が揃った状態の実測で在庫が制約かを確かめる。

## サイト帰属エラーが出たとき

```
[site-guard] サイト ID 不一致: 期待 959426 / 実際 984453
```

- **これは安全装置**。別サイト (doboku-note) のデータを stats47 のものとして取り込むのを防いでいる。
- 回避する引数・環境変数は用意していない。作らない。
- afb の切替が効かない場合は debug artifact (`.local/playwright-afb-debug/<runId>/`) の
  スクリーンショットと visible-text.txt を読み、Chosen ウィジェットの selector 変化を診断する。
- 期待 ID そのものが違う可能性もある (config `.claude/config/affiliate-asp.json` の `sites`)。
  実機の表示を確認してから config を直す。**推測で書き換えない。**

## 関連

- 規約: `.claude/rules/affiliate-ads-standards.md` (§0 意図軸 / §11 3 ASP 提携運用)
- 設定: `.claude/config/affiliate-asp.json` / 台帳: `.claude/state/ads/affiliate-catalog.json`
- コア: `.claude/scripts/ads/lib/{asp-browser-base,asp-browser,asp-site-guard}.mjs` (+ `__tests__/`)
- agent: `.claude/agents/affiliate-operator.md`
- 隣接 skill: `/scout-asp` (A8 案件開拓) / `/a8-report` (A8 成果取込) / `/register-affiliate-banner` (SSOT 登録)
- 認証プロファイル: `docs/01_技術設計/07_Playwright認証プロファイル.md`
