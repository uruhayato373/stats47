# バックログ自動処理ループ (backlog-loop) 標準

`docs/todo/` のバックログを自動で消化し、完了エントリを削除し、失敗から学習して
モデル割当まで自己調整するループの**単一ソース (SSOT)**。class 定義・completion gate・
安全境界はここが正典で、agent / skill / workflow は参照のみ。

> **背景 (2026-08-17 新設)**: バックログを消化する自動ループが無く、消化は人間が
> `03_今週の計画.md` へ引き取る運用に依存していた (W33 の週次振り返り自身が
> 「Must に置けば進み、Should 以下だと進まない」と記録)。さらに 05 の 52 件には
> 「機械チェックで再発防止できるもの」「テストで固定できるもの」「単なる勘違い」が混在し、
> 対話セッションがそれらに手こずっていた。原因は実行力ではなく**トリアージと学習の欠落**なので、
> 分類を一級市民にして分類ごとに決まった gate を通す。

---

## 1. SSOT 構造

| データ | 置き場 | 役割 |
|---|---|---|
| **真実源 (処理対象)** | `docs/todo/{05,06,01}` | 何を処理するか。完了は**行削除** |
| **routing policy** | `.claude/config/backlog-routing-policy.json` | class → model / effort / maxAttempts / 委譲 / 反映方法。数値はここだけ |
| **ledger (証拠と学習の原資)** | `.claude/state/backlog-loop/ledger.json` | 1 件 1 レコード upsert。**完了して行を消した後も証拠が残る** |
| 純関数 | `.claude/scripts/backlog-loop/{parse-backlog,queue,ledger,verify}-core.cjs` | I/O を持たない。テストが実ファイルに依存しない |
| CLI | 同ディレクトリの `*.mjs` | queue 生成 / outcome 記録 / verify |

**04_改善バックログは対象外**。`improvement-triage` の排他 write で、effect 判定は
effect-verdict エンジンが持つ。backlog-loop は読み取りもしない (verify が禁止パスとして弾く)。

---

## 2. class と completion gate (行削除の必要条件)

**gate を通していないエントリは削除できない。** verify が「消えた ID ⇔ ledger の
`gate.pass=true` な completed attempt」を突合し、欠けたら run を落とす。

| class | model | gate (実際に実行して記録する) | 反映 |
|---|---|---|---|
| `mechanical-gate` | sonnet | 新 checker/test が clean pass + **わざと壊すと fail する** red-green 証拠 + `check-checker-wiring` 配線 | direct-push |
| `test-fix` | sonnet | 再現テストが**先に red だった**記録 + 修正後 suite green | direct-push |
| `misconception-close` | sonnet | エントリ記載の再現手順を実行した「起きない」ログ + コード読解による理由説明の**2 証拠**。片方だけなら `deferred` | direct-push |
| `impl-small` | sonnet | エントリの `完了条件` コマンド green + diff が `scope` 内 | direct-push |
| `impl-large` | **fable** (委譲) | エントリの完了条件。**1 run 1 attempt**、未達なら行は残す | draft-pr |
| `indicator-expansion` | fable (委譲) | e-Stat 実在検証 → config → `validate:config` / `validate:years` green | draft-pr |
| `inbox-triage` (01) | sonnet | 種別確定 + 該当バックログへの転記、または削除条件該当の確認 | direct-push |
| `stale` | (機械) | `00_運用ガイド.md` の削除条件に機械的に該当 | direct-push |
| `needs-owner` | — | **削除も status 変更も不可**。週次 Issue へ surface のみ | surface-only |

`blocked-owner-*` / `blocked-*` / `pending-decision` 等は `queue-core.cjs` の `preClassify` が
**機械的に** `needs-owner` へ固定する。モデルに判定させない — 判定させると「owner 待ちを
モデルが勝手に進める」余地が残る。

---

## 3. 学習とモデル選定

### 二層構造

モデル割当は「agent frontmatter の静的既定」と「キューによる動的上書き」の二層
(`build-remediation-queue.mjs` が GSC 上位を opus critic に傾ける実装と同型)。CI の run 本体は
`--model sonnet` 固定なので、**上位モデルは Agent tool の委譲でしか使えない**。

### escalation は sonnet → fable → 人間で止める

`policy.escalation` の ladder に **opus を入れない**。難物を無限に上位モデルへ投げると
コストだけが増えて学習が起きない。fable でも失敗したら `needs-owner` として人間へ返す。

未知の class をモデルが名乗った場合は **fable ではなく安い側へ倒す** (`routeFor` の fallback)。
モデルが分類名を作って自分の予算を広げられないようにする。

### policy 更新のガード

週次の `update-routing-policy.mjs` は ledger + `claude-usage/history.csv` の実測から
class×model の成功率を出し、`guards` を通ったときだけ policy を書き換える。

| guard | 意味 |
|---|---|
| `minSamples` | 標本がこれ未満なら**変更しない** (effect-verdict の「判定不能は pending に留める」と同じ思想) |
| `windowDays` | 集計窓 |
| `demoteIfSuccessRate` | これ以上の成功率なら 1 段安いモデルへ降格 |
| `promoteIfSuccessRate` | これ未満なら 1 段上へ昇格 |

**リポジトリ全体の agent frontmatter `model:` 変更は自動でやらない。** 実測を添えた提案 PR
までで、人間が承認する (誤った降格が全 agent の品質に波及するため)。

---

## 4. 安全境界 (構造的に不能にしてあるもの)

| 禁止 | 何が止めるか |
|---|---|
| ゲート未実行での完了宣言 | `record-backlog-outcome.mjs` が `completed` に `--gate-commands` + `--gate-pass` を必須化 |
| gate 証拠なしの行削除 | `verify-backlog-run.mjs` が exit 1 |
| 処理対象外の ID を巻き込む削除 | 同上 (`removal-out-of-queue`) |
| ledger の直接編集 | CLI 経由のみ (agent の禁止事項に明記)。直接編集は証拠の捏造 |
| 04 / memory / learned への write | verify の `FORBIDDEN_PATH_PATTERNS` |
| `.env` 等の秘密 | 同上 + workflow の `disallowedTools` |
| owner 待ちの自動処理 | `preClassify` が needs-owner へ固定 |
| deploy / 本番 R2 push / force push | workflow の allowedTools に含めない |
| 暴走 (1 run で大量処理) | `policy.limits.maxItemsPerRun` |
| 同じ案件の無限リトライ | quarantine (連続失敗 `quarantineThreshold` 回で除外・成功で即復帰) |

---

## 5. 運用

```bash
# キューを見る (何が選ばれるか)
node .claude/scripts/backlog-loop/build-backlog-queue.mjs --limit 3
node .claude/scripts/backlog-loop/build-backlog-queue.mjs --json   # agent 用

# 1 件処理したら記録する (completed は gate 証拠が必須)
node .claude/scripts/backlog-loop/record-backlog-outcome.mjs \
  --id <ID> --class <class> --outcome completed --model sonnet \
  --gate-commands "npm run type-check,npm test" --gate-pass --evidence "..."

# 最後に必ず通す
node .claude/scripts/backlog-loop/verify-backlog-run.mjs --base <開始時HEAD> --queued <ID,...>

# テスト
node --test .claude/scripts/backlog-loop/__tests__/*.test.cjs
```

quarantine されたエントリを戻すには、原因を潰したうえで 1 度 `completed` を記録する
(`failCount` が 0 に戻り次の run から queue に復帰する)。理由は ledger の
`quarantine.lastReason` に残っている。

---

## 6. 役割分担

| 工程 | 担当 |
|---|---|
| 分類 + 軽作業 class の実処理・行削除 | `backlog-processor` (sonnet) |
| impl-large / indicator-expansion / escalated | `backlog-solver-hard` (fable・1 起動 1 件) |
| e-Stat 実在検証 / 観測値投入 / R2 push | `estat-researcher` / `data-ingester` / `r2-publisher` |
| 04 改善バックログ・effect 判定 | `improvement-triage` (排他・本ループは触らない) |
| memory / learned への記録 | `knowledge-curator` (排他・本ループは Issue で候補を出すのみ) |
| deploy | 人間の明示承認 |

---

## 関連

- 純関数とテスト: `.claude/scripts/backlog-loop/`
- policy: `.claude/config/backlog-routing-policy.json`
- TODO 作成契約 (行削除・status 語彙): `.claude/rules/docs-vs-issues.md`
- 運用ガイド (P0-P3・削除条件): `docs/todo/00_運用ガイド.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`
- 無人 Claude ループの安全契約 (複製元): `.github/workflows/ai-content-generate-daily.yml` /
  `.claude/scripts/lib/__tests__/content-generation-routine.test.cjs`
- agent: `.claude/agents/backlog-processor.md` / `.claude/agents/backlog-solver-hard.md`
- skill: `.claude/skills/management/process-backlog/SKILL.md`
