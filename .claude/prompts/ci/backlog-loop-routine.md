# backlog-loop 日次ルーチン (CI 無人実行)

<task>
  <goal>`.local/ci/backlog-queue.json` の `picked[]` を 1 件ずつ分類して処理し、機械ゲートを通したものだけバックログから行削除する</goal>
  <scope>.claude/todo/backlog.md と、各カードの完了条件が指す実装・テスト・checker。それ以外は触らない</scope>
  <sources>`.claude/rules/backlog-loop.md` (class 定義と gate 表の正典) / `.local/ci/backlog-queue.json` / 各エントリ本文</sources>
  <done_when>picked の各 ID について record-backlog-outcome を 1 回実行し、completed にしたものは該当行が消えている</done_when>
  <authorization>ローカルのファイル編集とテスト実行まで。commit / push / deploy / R2 push / gh コマンドは実行しない (CI 側の step が行う)</authorization>
</task>

BEHAVIOR CONTRACT (命令):

- 結論先行: 各エントリの処理結果を最初の一文で述べる。
- 進捗の実証: gate を**実際に実行**した結果だけを completed と報告する。未実行・未確認は failed か deferred。
- 境界: 下の「触ってはいけないもの」を 1 つでも破るなら、そのエントリは failed として記録し次へ進む。

## 手順 (picked の 1 件ごとに繰り返す)

### 1. 分類する

カード本文を読み、`.claude/rules/backlog-loop.md` の class 表から 1 つ選ぶ。カードのタグ行に `[検証:cmd]` があれば、それが完了 gate の第一候補。
`route._pendingClassification` が true なら自分で決める。既知 class があっても、読んで違うと
判断したら再分類してよい (台帳が `reclassifiedFrom` に履歴を残し、学習の材料になる)。

**この run で扱わない class** — `impl-large` / `indicator-expansion` は draft PR が要るので
CI では着手しない。`--outcome skipped --fail-reason class-needs-pr` で記録して次へ進む
(skipped は quarantine を増やさない)。

`needs-owner` に見えるもの (オーナーの決定が要る・削除可否が人間判断) も同様に
`--outcome skipped --fail-reason needs-owner` で記録する。**勝手に決めない。**

### 2. 完了条件を満たす作業をする

class ごとの gate は正典の表に従う。**gate は宣言ではなく実行する。**

- `mechanical-gate` — checker / test を書き、正しい状態で通ること**と**わざと壊すと落ちることの
  両方を実測する。片方だけなら deferred (「全 PASS」は「何も見ていない」と区別がつかない)
- `test-fix` — 再現テストが先に red だったことを確認してから直す
- `misconception-close` — 再現手順を実行して起きないログ **と** コードを読んだ理由説明の 2 つ。
  片方だけなら deferred
- `impl-small` — エントリの完了条件コマンドが green で、diff が scope 内

### 3. 結果を記録する

```bash
node .claude/scripts/backlog-loop/record-backlog-outcome.mjs \
  --id <ID> --class <class> --outcome <completed|failed|deferred|skipped> \
  --model sonnet [--gate-commands "..." --gate-pass] [--fail-reason "..."] \
  --evidence "何を根拠にそう判定したか (≤280字)"
```

`completed` は `--gate-commands` と `--gate-pass` の両方が必須。CLI が無ければ exit 1 で弾く。

閉じた結果として**小さい残件が出た場合だけ** `--follow-ups <新ID>` で名指しし、その ID の
エントリをバックログへ追加してよい。名指ししていない新規追加は verify が落とす (仕事の捏造防止)。
残件が無いなら追加しない。

### 4. completed のものだけ行を消す

行番号で消す (文字列一致は同じ語を含む別エントリを壊す)。エントリの見出し行から次の
見出し直前までを、末尾の空行 1 つと一緒に消す。

## 触ってはいけないもの

| 対象 | 理由 |
|---|---|
| `.claude/todo/improvements.md` | improvement-triage の排他 write |
| `.claude/memory/` / `.claude/skills/learned/` | knowledge-curator の排他 write |
| `.github/` | ループが自分の権限・timeout・モデルを広げる口になる |
| `.claude/config/backlog-routing-policy.json` | 自分の model / 試行上限を上げる口になる |
| `.claude/state/backlog-loop/ledger.json` の直接編集 | 証拠の捏造。CLI 経由のみ |
| 🟣 判断待ち・`[実行:対話/ユーザー/windows/別環境]`・`[進行中]` のカード | オーナー判断待ち or 作業中 (queue が弾くが、直接触るのも禁止) |
| git commit / push / deploy / R2 push | CI の step が行う。ここでは実行しない |

CI の verify がこれらを機械的に突合する。破ると run ごと落ちるので、迷ったら触らない。

## 最後に

処理した全 ID について record を 1 回ずつ実行したことを確認してから終える。
背景で起動した subagent がある場合は完了を待つ (未完のままターンを終えない)。
