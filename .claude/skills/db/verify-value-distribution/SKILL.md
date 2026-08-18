---
name: verify-value-distribution
description: 疑わしい値分布 (ゼロが多い・県数が少ない・負値がある) を持つ metric の中身を一次情報で確かめ、検証済みプロファイルに「予測」として記録する。ユーザーが「値がおかしい指標を調べたい」「未検証キューを消化したい」「ゼロだらけのランキングを確認して」等と言ったときに使う。週次監査 (l) が起票した未検証分の消化にも使う。
primary_agent: data-ingester
co_agents: [estat-researcher]
---

# verify-value-distribution — 疑わしい値分布を検証してプロファイルに記録する

正典: `.claude/rules/metric-config-standards.md` §検証済みプロファイル方式。
機械は**広く疑う**だけで正当かは判定できない。中身を確かめるのがこの skill の仕事。

## なぜ人 (agent) が要るのか

「地熱発電所が 40/47 県でゼロ」は正当、「公共ボウリング場が 47/47 県でゼロ」は無価値。
この差はデータの形の中に無い。2026-08-04 に経年比較で機械分離を試みて**失敗した**
(壊れているものほどずっと壊れているので変化が出ず、年が 1 つしかなく比較不能なものが 8 件あった)。
だから **広く疑って、確かめたものだけ通す**方式にしている。

## いつ使うか

- 週次監査 (`ranking-integrity-audit-weekly.yml`) の check (l) が未検証の増加で失敗したとき
- `[Ranking Alert]` Issue に `profile-violated` が出たとき (**最優先** — 検証済みの予測をデータが破った)
- 未検証キューを計画的に消化したいとき

## 手順

### 1. キューを取る

```bash
# 全件走査から (ネットワークのみ・認証不要)
npx tsx packages/data-configs/scripts/scan-stats-shape.ts --verification-queue > /tmp/vq.json

# または週次監査の成果物から
cat .claude/state/ranking/integrity-audit.json | jq '.valueVerification'
```

`profileViolated` があれば**そちらを先に**見る。未検証より深刻で、「検証時に書いた予測をデータが
破った」= 検証が古くなったか、データが劣化したかのどちらか。

### 2. 中身を確かめる

疑いの種別ごとに見るところが違う。

| 疑い | 確かめること | 主な手段 |
|---|---|---|
| `zero-suspicion` | ゼロの県に**本当に存在しないのか**。集計軸の取り違えで 0 になっていないか | e-Stat メタ (`/inspect-estat-meta`)・一次情報・施設の実在確認 |
| `thin-suspicion` | **欠落県を実際に列挙**し、その県が調査対象外である理由があるか | R2 `app/stats/<key>/values.json` と `packages/area/src/data/prefectures.json` を突合 |
| `negative-suspicion` | 指標が**定義上マイナスを取りうるか** (増減率・収支・気温) | config の title / unit / description |

調査そのものは `estat-researcher` に委譲してよい (read-only 調査が本来の責務)。
その場合、agent には**根拠 (何をどう確認したか) と出典 URL まで**返させる。

### 3. プロファイルに「予測」を書く

`packages/data-configs/src/verified-value-profiles.ts` に追記する。
**boolean ではなく観測できる上限・下限を書く**のがこの方式の要。

```ts
{
  key: "geothermal-power-plant-count",
  zeroShareMax: 0.9,        // 現在 0.85 → 少し余裕を持たせる
  evidence: "地熱発電所は大分・秋田など 7 県のみに立地。ゼロの 40 県に実在しない",
  sourceUrl: "https://www.e-stat.go.jp/dbview?sid=...",
  verifiedAt: "2026-08-05",
}
```

- 予測は**中身を見ないと書けない**数字にする。書いた数字は以後ずっと機械が照合し、
  データが変われば `profile-violated` で自動的に戻ってくる
- `evidence` は検証可能な事実。「たぶん施設が少ないから」は不可
- **余裕の持たせ方**: 標本の揺れで毎週赤くならない程度 (現在値 +0.05 程度) に留める。
  大きく緩めると予測として機能しない

### 4. 判断が付かないものは書かない

**これが一番大事。** 根拠を得られなかったものは profile を書かず `unverified` のまま残す。
未検証はラチェットに載って消えないので、後日また出てくる。
推測で埋めると「緑の板と実際の検証が区別できない」状態になり、方式そのものが無意味になる。

### 5. 壊れていた場合

正当でないと分かったら profile ではなく metric 側を直す。

| 状況 | 対応 |
|---|---|
| 軸の絞り忘れ・単位の誤り | config 是正 → `data/data-refresh-requests.json` で再取り込み (data-ingester) |
| 出典そのものが取得不能 | 代替出典を `.claude/todo/backlog.md` へ。当面は退役 |
| 実態が 0 で ranking にならない | `isActive: false` + GONE 登録 (手順は `ranking-key-consistency.test.ts` の「直し方」) |

### 6. 検証する

```bash
npx vitest run src/__tests__/verified-value-profiles.test.ts --root packages/data-configs
npx tsx packages/data-configs/scripts/scan-stats-shape.ts --verification-queue | jq '.summary'
```

`unverified` が**書いた件数だけ減っている**こと。減っていなければ予測が疑いを cover していない
(例: ゼロ率だけ書いたが県数も少ない metric)。

## 禁止事項

| NG | OK |
|---|---|
| 根拠なしに profile を書いて緑にする | 判断が付かなければ unverified のまま残す |
| `evidence` に「正当」「問題なし」とだけ書く | 何をどう確認したかを書く |
| `profile-violated` が出たとき予測値を緩めて黙らせる | データが変わった理由を調べ、必要なら metric を直す |
| 同じ evidence を大量の key にコピペ | 台帳 lint が 6 件以上の重複を弾く |
| 週次監査の baseline を手で上げる | 未検証が増えたのは新しい疑わしい metric が入った証拠。原因を見る |

## 関連

- 判定ロジック: `packages/data-configs/src/value-verification.ts` (純関数・テスト付き)
- 台帳: `packages/data-configs/src/verified-value-profiles.ts`
- 監査 check (l): `packages/ranking/src/scripts/audit-ranking-data-integrity.ts`
- 壊れの allowlist (別 SSOT): `packages/data-configs/src/expected-shape-anomaly.ts`
- 形状ゲート: `.claude/rules/metric-config-standards.md` §機械的な検査
