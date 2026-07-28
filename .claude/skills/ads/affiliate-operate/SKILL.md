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
| `apply` (dry-run) | `node .claude/scripts/ads/affiliate-apply.mjs --asp <moshimo\|afb> --id <id>` | なし |
| `apply --commit` | 同上 `--commit` | **提携申請を送信 (不可逆・要オーナー承認)** |
| `scan` | `node .claude/scripts/ads/afb-scan.mjs [--vertical <軸>] [--mode search\|crawl]` | なし (走査 JSON を .local に出力) |

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
- 反映するときだけ `--write` を付ける (既定は read-only)。
- ログ: `.local/affiliate-status/status.log`

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
# まず dry-run (押せる状態かだけ確認)
node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --id 6154
# オーナー承認を得てから実申請
node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --id 6154 --commit
```

- **`--commit` は外部への不可逆送信 (規約同意を伴う)。オーナーの明示承認なしに実行しない。**
- Red Line 案件 (`redLine: true`) は `--commit` でも申請前に落ちる。
- 「一括提携申請へ」は候補から機械除外される (押すと画面上の全案件を一度に申請してしまうため)。
- もしもの申請フォームのサイト select は read-back 確認を通らなければ押さない。
- A8 の申請は本 skill の対象外 → `/scout-asp` (週次上限ガード付き)。

### 4. ASP 間比較 → 運用先を 1 つに寄せる

カタログの `programs[].asps` に単価・確定率・EPC が揃ったら比較表を出す。
同一案件を複数 ASP で並行運用すると成果の帰属が割れて EPC 集計が二重管理になるため、
**判断材料の多い ASP に寄せる** (もしもは承認率・EPC を非公開)。決定は `decision` に理由付きで残す。

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
- 認証プロファイル: `docs/01_技術設計/playwright-auth-profiles.md`
