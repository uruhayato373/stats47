---
name: scout-asp
description: A8.net の高単価アフィリエイト案件を Playwright で自動 scout → 提携申請 → 広告コード取得 → SSOT 登録 → R2 公開まで回す。週次 cron (ローカル Mac 限定) の full モード + 手動サブモード (scout/apply/harvest/register/status)。Use when user says "A8 案件を探す", "アフィリエイト自動申請", "高単価案件 scout", "scout-asp".
disable-model-invocation: true
primary_agent: asp-scout
co_agents: [affiliate-manager]
---

A8.net の高単価案件を **scout → 申請 → コード取得 → SSOT 登録 → 公開** まで自動化する。
判定はすべて決定的コードに委譲し、agent の意味判断は「pending-vertical 解決」「UI 変化診断」の 2 点のみ。

> **正典は `.Codex/rules/affiliate-ads-standards.md` §10**。本 skill は手順のみ。スコア式・blocklist・
> vertical 写像・申請上限は `.Codex/scripts/ads/data/a8-curated.json`、状態機械は `a8-scout-core.mjs` が SSOT。
> 手動貼付での 1 件登録は従来どおり `/register-affiliate-banner` (両者は `a8-code-core.mjs` の抽出仕様を共有)。

## 前提: 初回セットアップ (1 回だけ・人間)

1. **A8 手動ログイン** (credential は env に置かない・永続プロファイル方式):
   ```bash
   node .Codex/skills/ads/scout-asp/scripts/login.mjs   # 本体 ~/stats47 で実行 (worktree 不可)
   ```
2. **セレクタ実機チューニング** (A8 の DOM は本コードの推測値。初回だけ確定が要る):
   ```bash
   npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts scout --dry-run --headed
   # → .local/playwright-a8-debug/ に page 構造 + スクショをダンプ。
   #    a8-browser.ts の A8 定数 (URL/セレクタ) を実機に合わせて調整する。
   ```

## モード

`/scout-asp [scout|apply|harvest|register|full|status]` (既定 `status`)。

| モード | 動作 |
|---|---|
| `import-partnered` | A8 で既に提携中の全プログラムを全ページ巡回 → catalog に approved で取り込む (申請不要で harvest 直行。既存資産の活用) |
| `scout` | A8 検索 → scoreAndRank → catalog に candidate upsert (`a8-browser.ts scout`) |
| `apply` | candidate 上位を週次上限内で自動申請 → applied (`check-a8-apply-budget` が上限強制) |
| `check-approval` | 参加中一覧を**全ページ**走査し applied → approved へ昇格。降格はしない |
| `harvest` | approved の広告コード取得 → parse → harvested / pending-vertical |

> **★2026-08-04 修正**: `check-approval` は以前 参加中一覧の **1 ページ目 (20 件) しか
> 読んでいなかった**。実機の参加中は 158 件あり、承認済みでも 2 ページ目以降にある案件は
> `applied` のまま滞留していた (手動走査で 20 件を回収した)。一覧は `APPROVED_DATE` の
> 降順なので直近承認は 1 ページ目に載るが、**週次 cron が止まっていた期間の承認は後方へ流れる**。
> 現在は `import-partnered` と同じく `pageSize=100` で全ページを辿る。

### サブコマンドのフラグ (2026-07-28 追加)

| フラグ | モード | 意味 |
|---|---|---|
| `--query 賃貸,移住` | scout | **キーワード検索モード**。カテゴリ巡回 (1 カテゴリ 20 件) をやめて指定語で検索する。意図が確定しているときに使う。URL は実機ダンプで確定した `/program/search/keyword?keywords=` |
| `--vertical housing` | scout | 検索モードでの vertical ヒント。あくまでヒントで、最終判定は `resolveVertical` (キーワード写像) が行う |
| `--promote s000...,s000...` | scout | **minScore 未満の案件を candidate に昇格**する。score は単価と EPC が支配的なので、1 件あたりの報酬が低い軸 (ふるさと納税等) は需要が大きくても候補に上がらない (2026-07-28 実測: さとふる 0.29 / ふるさとチョイス 0.24 が黙って落ちていた)。**その run で実際に収集できた案件しか昇格できない** (存在しない ID は中止)。スコア式は変えない — 他軸への影響が読めないため、在庫ゼロ軸だけを人/agent の判断で通す |
| `--id s000...,s000...` | apply | **申請対象を programId で明示指定**。指定 ID が candidate に無ければ中止する。**スコア式は単価と EPC で並べるだけでブランド適合を見ない**ため、指定なしで回すと不適な案件へ送信してしまう |
| `--include-registered` | harvest | 既 registered からも **text コードだけ**を取る (text 在庫の後追い取得)。registered は状態機械上 harvested へ戻せないので status を変えず `pendingDrafts` に積み、`append-affiliate-ads.ts` が status 非依存で拾う。二重登録は a8mat 突合が防ぐ |
| `--text-only` | harvest | banner を取らず text だけ採る |
| `register` | harvested を SSOT 追記 + 4 ゲート → registered (`append-affiliate-ads.ts --apply`)。commit/push は下記 |
| `full` | scout → apply → check-approval → harvest → register を順に (**手動フル実行専用**) |
| `status` | catalog の状態機械サマリ + pending-vertical 滞留を表示 |

## 週次 cron は full を呼ばない (2026-07-27 改訂)

`scripts/scheduled/scout-asp-weekly.sh` は **Codex (LLM) を起動せず決定的スクリプトだけ**を回す
(`check-approval` → `select-for-register --apply` → `harvest --limit 12` → `append` **dry-run** → catalog サマリ)。
トークン消費ゼロ。**`scout` / `apply` は既定無効** (`APPLY_NEW=0`) で、SSOT 追記と develop push もしない。
理由と再開条件は `.Codex/rules/affiliate-ads-standards.md` §10「週次 cron の中身」を正典とする
(要約: affiliate の CTR が計測不能なため在庫を増やす根拠が無い)。

## full の流れ (手動フル実行時)

```
(1) scout        a8-browser.ts scout            → candidate
(2) apply        check-a8-apply-budget → a8-browser.ts apply  → applied (審査待ち含む)
(3) check        a8-browser.ts check-approval   → approved (参加中一覧を全ページ走査し applied 全件を照合)
(4) harvest      a8-browser.ts harvest          → harvested / pending-vertical
(5) register     append-affiliate-ads.ts --apply (tsc/audit/export/compliance の 4 ゲート) → registered
(6) commit/push  affiliate-manager が develop へ push → publish-affiliate-ads.yml 発火 → R2 公開
```

- **(5) の 4 ゲートが 1 つでも fail すると SSOT は実行前の byte 列で自動復元**され register は止まる (SSOT 破壊防止。2026-07-29 に git checkout 復元を廃止 — 未コミット変更を消さないため。doc 42 §9.2)。
- **(6) の commit/push は affiliate-manager (SSOT 排他 writer) の役割**。register で SSOT + catalog が
  更新された後、`apps/web/scripts/affiliate-ads-data.ts` と `.Codex/state/ads/a8-catalog.json` を
  同一 commit で develop に push する (outward-facing なので実行前に確認)。公開後、次回 run 冒頭で
  R2 `app/affiliate-ads/all.json` に id 存在を確認して catalog を published に昇格。

## pending-vertical の解決 (agent の意味判断)

vertical map で解決できなかった案件は `harvest` 後に `pending-vertical` で滞留する。
`status` で一覧 → agent が広告主を見て 10 軸のどれかを判断 → `a8-catalog.json` の該当 entry の
`vertical` を付与し `status` を `harvested` に戻す (agent の意味判断による catalog 手編集。CLI フラグは無い)。
判定できなければ登録しない (偽の vertical を付けない)。恒久的に解決不能なら curated の `verticalKeywords` に
語を足して次回 scout から自動解決させる。

## 既存提携の登録フロー (import → 精選 → harvest → register → 公開)

134 件の既存提携から「高 EPC×高確定率」を精選して配置する定常フロー:

```bash
# 1. 既存提携を取り込み (EPC/確定率/報酬も保存)
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts import-partnered
# 2. vertical 別に確定EPC上位N (既定4) を精選 → selectedForRegister + priority を刻印
node .Codex/scripts/ads/select-for-register.mjs --per-vertical 4 [--apply]
# 3. 精選分の広告コードを取得 (canonical 300×250 バナー優先・無ければ text)
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts harvest [--limit N]
# 4. SSOT 追記 (tsc/audit/export/compliance/a8mat の5ゲート・既登録は a8mat で skip)
npx tsx .Codex/scripts/ads/append-affiliate-ads.ts [--apply]
# 5. commit + develop push → publish-affiliate-ads.yml が R2 公開 (affiliate-manager)
```

priority は確定EPC (=EPC×確定率) のバンド式で決定的算出 (`computePriority` / curated `priorityBands`)。
同 vertical×枠は priority 上位1 banner+text2 しか出ないため、全 134 登録は無意味 (精選が正)。

## サブコマンド直呼び (デバッグ)

```bash
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts import-partnered   # 既存提携を approved で取り込み
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts scout [--dry-run] [--limit N] [--headed]
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts apply [--dry-run] [--max N]
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts check-approval [--dry-run]
npx tsx .Codex/skills/ads/scout-asp/scripts/a8-browser.ts harvest [--dry-run]
npx tsx .Codex/scripts/ads/append-affiliate-ads.ts [--apply]     # register (既定 dry-run)
node .Codex/scripts/ads/check-a8-apply-budget.cjs                # 今週の申請残枠
```

## 制約 (必ず守る)

- **週次 cron はローカル Mac 限定** (プロファイルは `.local/`・GitHub Actions では動かない)。
- **セッション失効 (isLoggedIn 失敗) は catalog に error 記録して正常終了** — cron を壊さない。再ログインは人間。
- **審査落ち (rejected) は再申請しない**。
- **申請は週 `weeklyApplyMax` 件まで** (`a8-curated.json`。A8 スパム判定回避)。
- **SSOT (affiliate-ads-data.ts) は append-affiliate-ads.ts 経由のみ機械追記**。手編集しない。

## 関連

- 正典ルール: `.Codex/rules/affiliate-ads-standards.md` §10
- コア: `.Codex/scripts/ads/lib/{a8-scout-core,a8-code-core,a8-append-core}.mjs` + `__tests__/`
- ブラウザ: `.Codex/skills/ads/scout-asp/scripts/{a8-browser.ts,login.mjs}`
- カタログ: `.Codex/state/ads/a8-catalog.json` (状態機械) / curated: `.Codex/scripts/ads/data/a8-curated.json`
- 手動登録: `/register-affiliate-banner` / agent: `asp-scout` (ブラウザ) + `affiliate-manager` (SSOT 排他 writer)
- 認証方式: `docs/01_技術設計/07_Playwright認証プロファイル.md`
