# Cycle Decision Tree

`/goal cycle` の effect 判定とその後の分岐を定義する。`.claude/rules/evidence-based-judgment.md` を前提とする。

## effect 判定の 5 値

| 判定 | 基準 | 次アクション |
|---|---|---|
| **effect/full** | 想定値の 80% 以上達成、かつベースラインから明確に改善 | 終了条件達成なら close success、未達なら次サイクル |
| **effect/partial** | 想定値の 30〜80% 達成 | 次サイクル(同方向の追加施策 or 新仮説) |
| **effect/none** | 想定値の 0〜30%(noise 圏) | 次サイクル(別仮説に転換) |
| **effect/adverse** | ベースラインより悪化 | **即 revert** + 次サイクル(根本原因再調査) |
| **effect/pending** | 計測未了 or 判定材料不足 | 計測再実行 or 待機(min_wait_days を満たすまで) |

## 判定フロー

```
[計測完了]
   ↓
[evidence-based-judgment チェック]
   ├─ NG ワード使用?     YES → 文言修正、再判定
   ├─ 検証コマンド実行?   NO  → 実行してから判定
   ├─ before/after 明確?  NO  → 計測やり直し
   └─ 想定の 80% 未達なら、未達仮説を書いたか?
      YES → effect/pending か effect/* 確定へ
      NO  → 未達仮説と次の検証コマンドを書いてから判定
   ↓
[実測値 / 想定値 を計算]
   ↓
   ├─ X >= 80% かつ ベースラインから改善     → effect/full
   ├─ 30% <= X < 80%                       → effect/partial
   ├─ 0% <= X < 30%                        → effect/none
   ├─ X < 0% (ベースラインより悪化)         → effect/adverse
   └─ 計測未了 / min_wait_days 未満         → effect/pending
```

## 分岐の具体例

### effect/full の場合
1. 終了条件達成(`success_criteria` を満たす)→ `/goal close <slug>` を提案
2. 終了条件未達(部分的改善で 80% は達成だが全体目標未達)→ 次サイクルへ進む

### effect/partial の場合
- 同方向の追加施策(同じ仮説カテゴリの別 ID)を次サイクル候補に
- 例: PSI で A1(Cookie banner SSR) が partial → A2(Portal 化)を次に試す or B 群(AdSense)を組み合わせる

### effect/none の場合
- 仮説が間違っていた可能性高い
- 別カテゴリの仮説に切り替え(A → B → C のジャンプ)
- 例: A1 が none → B1+B5(AdSense 軽量化)に転換

### effect/adverse の場合
- **24 時間以内に revert PR を作成**(`EXP-002 ADVERSE` の教訓)
- 根本原因再調査:Lighthouse audit から仮説作り直し
- 同じ仮説を再試行する場合は何が変わったかを明示

### effect/pending の場合
- 計測待ち(min_wait_days 未満)
- 計測失敗(API エラー等)
- 判定材料不足(before/after の比較対象が不明確)
→ 待機 or 再計測 or 判定基準の再設定

## 撤退条件の判定

各 cycle 判定後に以下をチェック:

1. **cycle 数 ≥ max_cycles** → `/goal close <slug> timeout`
2. **連続 2 サイクル effect/none or effect/adverse** → 仮説プール根本見直し or close abandoned 判定
3. **累計工数 ≥ 撤退基準工数**(define 時に設定)→ close abandoned 判定
4. **ベースラインから 30 日経過してもなお目標達成率 < 30%** → close abandoned 判定検討

## 注意事項

- **effect/full を急いで付けない**: 想定値計算がいい加減なら 80% 達成は意味がない。define 時の想定値根拠を再確認
- **partial が連続する場合は前進判定**: 例えば LCP 16,000 → 10,000 → 6,000 → 3,000 のような段階的改善は全体として valid
- **adverse 判定後の改善 PR と前の施策を混ぜない**: 各 cycle は独立して判定可能な状態にする
