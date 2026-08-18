---
name: audit-provenance
description: データ出典・再現性 (provenance) の全量棚卸しと是正。metric/blog/theme の出典記録が「いつでも一次資料から再取得・再検証できる」水準かを機械チェックし、欠落 (クラスB/C/D) を復元する。ユーザーが「出典を監査」「provenance チェック」「再現性を確認」「出典が足りない指標を直す」等と言ったときに使う。
primary_agent: open-data-curator
---

# audit-provenance — データ出典・再現性の監査と是正

正典: `.Codex/rules/data-provenance-standards.md`。機械チェック (lint + queue) は床、意味判断 (出典が本当に
正しいか) は agent/人間。

## いつ使うか
- 「出典・再現情報が十分か監査したい」「provenance が薄い指標を直したい」
- 新規 metric 投入後の provenance 確認 (data-ingester からの引き継ぎ)
- 週次 cron (`provenance-audit-weekly.yml`) が起票した Issue の消化

## 手順

### 1. 棚卸し (現状把握)
```bash
npx tsx .Codex/scripts/provenance/audit-provenance-queue.ts
```
→ `.Codex/state/provenance/{queue.json,LATEST.md}` を再生成。クラス分布 (A/A'/B/C/D) と是正対象 (C欠落+D) を表示。
`LATEST.md` の「是正対象」リストが worklist。

### 2. lint で床を確認
```bash
npm run validate:config --workspace=@stats47/data-configs 2>&1 | grep -E "内訳|provenance|calc-ref"
```
- `[provenance]` error = 手動抽出 (manual) の provenance 欠落 (isActive:true)。**最優先で是正**
- `[provenance-thin]` warn = 再取得キー/出典URL が無い external (クラスB/D)
- `[calc-ref]` error = 計算系の参照先 metric 不在

### 3. 是正 (クラス別)

| クラス | 是正方法 |
|---|---|
| **C 欠落** (manual) | 一次資料を再取得し provenance 9点セット (`data-provenance-standards.md` §2) を config.source.config.provenance に記録。手本 = `ambulance-hospital-arrival-time.ts` |
| **B/D external-estat** (config 空) | fetcher 実装 (`packages/*/src/.../fetchers/`) から statsDataId を掘り config.estat.statsDataId に記録 → クラスA'昇格 |
| **B/D mlit_dpf/mlit_ksj** | fetcher から dataset ID / API を掘り config に記録 (ksjDataId+ksjVersion 等) |
| **D unknown** (`prefectural-income-per-capita` 等) | 出典を再調査 (open-data-curator 相当) して source を確定。不明なら isActive:false に落として調査 |
| **calc-ref** | 参照先 metric key を registry の実在キーに修正 |

出典の**意味的正しさ** (この statsDataId が本当にこの指標か) は fetcher コード + e-Stat 実確認で裏取りする
(推測で埋めない・`evidence-based-judgment.md`)。

### 4. 再検証
```bash
npm run validate:config --workspace=@stats47/data-configs   # error 0 を確認
npx tsx .Codex/scripts/provenance/audit-provenance-queue.ts # 是正対象が減ったことを確認
```
是正済みは queue.json の needsWork から自動的に外れる (registry 再評価)。

### 5. warn → error 昇格 (Wave B 完了時)
`[provenance-thin]` の対象が 0 になったら、`validate-metric-config.ts` の該当 `warns.push` を `errors.push` に
昇格し、`metric-config-standards.md` / `data-provenance-standards.md` §4 の昇格履歴に日付付きで追記する。

## 分担
- 機械 (lint / queue): クラス分類・欠落検出・参照実在
- agent (`open-data-curator` = provenance 監査オーナー / `data-ingester` = 投入時記録): 出典の意味判断・復元
- 人間: D クラスで出典が真に不明なケースの最終判断

## 関連
- 正典: `.Codex/rules/data-provenance-standards.md`
- lint: `packages/data-configs/scripts/validate-metric-config.ts`
- queue: `.Codex/scripts/provenance/audit-provenance-queue.ts` → `.Codex/state/provenance/`
- cron: `.github/workflows/provenance-audit-weekly.yml`
- 手本 (blog): `.Codex/scripts/blog/build-lineage-queue.mjs`
