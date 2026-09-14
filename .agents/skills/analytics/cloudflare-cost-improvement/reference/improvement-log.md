# Cloudflare コスト改善ログ (agent 用詳細)

一覧・status の真実源は `.claude/todo/improvements.md`。ここは検証コマンド・仮説・期日の詳細ログ。
記入テンプレ: `.claude/rules/evidence-based-judgment.md` §改善ログ記入テンプレ。

`### 判定` セクションは `.claude/scripts/lib/effect-verdict/` の閾値エンジンが upsert する。
判定・根拠データ・閾値 SSOT・ガード・再現コマンドの 5 項目が必ず出る。ガードが 1 つでも
hit していれば `effect/pending` に留まり、確定ラベルは付かない。

計測データの置き場: 日次 usage は `.claude/state/metrics/cloudflare/`、月次・週次 snapshot は
`reference/{monthly,weekly}-snapshots/`、閾値は `reference/budgets{,-daily}.json`。

### R2-STORAGE-01 R2容量のsiteScope分離と再増加検知

- **観測日**: 2026-08-24
- **比較元**: `.claude/state/metrics/cloudflare/snapshots/{2026-08-19,2026-08-22}.json`
- **bucket差分**: アカウント合計 +6,817,934,632 bytes。内訳は stats47 +211,516,897、
  doboku-note -707,638,925、doboku-note-archive +7,314,056,660、stats47-cache 0。
  アカウント増加の最大siteScopeはdoboku-note-archiveで、stats47単独の増加ではない。
- **stats47直接実測**: S3 ListObjectsV2で11,392,548,695 payload bytes / 53,085 objects。
  2026-08-20T17:56:32.044Z以降に更新された現存objectは634,412,512 bytesで、上位は
  `app/blog` 246,000,331 bytes、`incremental-cache` 360,122,060 bytes、
  `estat-api/stats-data` 17,595,007 bytes。これは上書きを含む更新量で、純増値ではない。
- **保持判定**: `gis/**`、`app/**`、`ges/**`、`note/**`、`video/**`は保持規約対象。
  ISRは3世代 / 2,198 objects / 343.44MBで、保持上限4世代以内。allowlist済み旧prefixは0 objects。
- **削除候補**: 投稿後30日超のMP4 2本 / 22.7MBのみ。削除しても無料枠超過を解消しないため、
  本診断では削除せず、週次`cleanup-r2-sns-videos.yml`の対象として維持する。
- **再増加alert**: アカウント合計18GB超に加え、stats47 bucket 12.5GB超を独立metricとして追加。
  ISRは`audit-incremental-cache.ts --keep 3 --assert-max 4`をデプロイ後・週次に継続する。
- **再現コマンド**:
  `npx tsx packages/r2-storage/src/scripts/r2-du.ts --depth 2` /
  `npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts --keep 3 --assert-max 4` /
  `npx tsx packages/r2-storage/src/scripts/r2-retention.ts` /
  `npx tsx packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts`
- **判定**: stats47の診断工程は完了。無制限ISR蓄積は再現せず、アカウント超過は別siteScopeを含む。
  stats47側の削除可能量は22.7MBで解消に足りない。`R2-STORAGE-01`は、doboku-note-archiveの
  保持方針をオーナーが判断するまでactiveに維持する。
