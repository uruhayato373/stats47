# R2 ストレージ監査メモ (2026-06-21)

## 実測サマリ

`npx tsx packages/r2-storage/src/scripts/r2-du.ts --depth 2` で本番 R2 (`stats47`) を確認。

- 総量: 53,550 objects / 31.55 GB
- 最大要因: `incremental-cache/*` 24,113 objects / 21.43 GB
- 次点:
  - `gis/mlit-ksj/`: 2,918 objects / 3.24 GB
  - `app/ranking/`: 10,727 objects / 1.02 GB
  - `app/stats/`: 2,352 objects / 480.35 MB
  - `app/correlation/`: 1,955 objects / 117.07 MB
  - `app/blog/`: 4,578 objects / 86.03 MB

## 実施済み削除

2026-06-21 に `incremental-cache/` の旧世代を削除した。

```bash
npm run audit:incremental-cache --workspace packages/r2-storage -- --keep 3 --apply
```

結果:

- 削除: 17 generations / 20,286 objects / 17.38 GB
- エラー: 0
- 削除後の R2 全体: 33,336 objects / 14.2 GB
- 削除後の `incremental-cache/`: 3 generations / 3,844 objects / 4.08 GB

## 旧設計由来の削除候補

削除前に必ず `delete-r2-prefix.ts --dry-run` 相当で対象キーを確認すること。

| 候補 | 容量 | 判断 | 根拠 |
|---|---:|---|---|
| `app/area-profile/` | 47 objects / 3.8 MB | 削除候補 | 現行 reader は `app/areas/{areaCode}/profile.json`。`app/area-profile/*` の live 参照なし。 |
| `app/surveys/all.json` | 1 object / 19.24 KB | 削除候補 | 現行は `app/survey/all.json`。複数形 `app/surveys/*` の live 参照なし。 |
| `app/categories/all.json` / `app/categories/list.json` | 2 objects / 約19 KB | 削除候補 | live reader は root `categories/all.json`。`app/categories/*` は SVG コメント以外の参照なし。 |
| `app/themes/*/config.json` | 24 objects / 60.97 KB | 削除候補 | `packages/database/src/schema/themes.ts` に vestigial と明記。現行テーマ設定は git TS (`ALL_THEMES`)。 |
| `.DS_Store`, `sns/.DS_Store`, `ges/.DS_Store` | 3 objects / 22 KB | 削除候補 | 明らかな不要ファイル。 |
| `app/ranking-items/all.json` | 1 object / 4.1 MB | 要確認 | 主要 runtime は per-key `app/ranking/{key}/item.json` へ移行済み。ただし `generateStaticParams` 系・相関生成・運用メモでまだ参照が残るため即削除は危険。 |
| `app/port-statistics/`, `app/ports/`, `app/fishing-ports/` | 約7.5 MB | 要確認 | 旧ルートは廃止済みだが、テーマ側で port/fishery データとして使う可能性がある。削除前にテーマ表示と exporter を確認。 |

## 容量主因: incremental-cache

`incremental-cache/` は 20 世代分の build id らしき prefix が残り、合計 21.43 GB。

監査コマンド:

```bash
npm run audit:incremental-cache --workspace packages/r2-storage -- --keep 3
```

削除実行:

```bash
npm run audit:incremental-cache --workspace packages/r2-storage -- --keep 3 --apply
```

`--apply` なしは dry-run のみ。`--keep N` は最終更新日時が新しい N 世代を保持する。

上位:

- `incremental-cache/_hHv3Pq45gLVVf_jMBL9x/`: 2.01 GB
- `incremental-cache/xKppVRTbuV1zzGwgE6F0O/`: 1.23 GB
- `incremental-cache/ZjYp4Mef_V1qULudTNUvl/`: 827.84 MB
- `incremental-cache/vuIXDZ4xKfhKc73nF2EB6/`: 5.49 GB (旧世代)
- `incremental-cache/o92CJwIminT532_Jh9-Mb/`: 4.66 GB (旧世代)
- `incremental-cache/U9H0XCYl40TYqWIzBFzCB/`: 2.74 GB (旧世代)

これは旧設計の異物というより OpenNext の R2 incremental cache 世代が蓄積している状態。現行 deploy で使う build id 以外は原理上不要。

2026-06-21 の dry-run (`--keep 3`) では、最新 3 世代を保持した場合の削除候補は以下。

- 17 generations
- 20,286 objects
- 17.38 GB

推奨:

1. `--keep 3` dry-run を確認する。
2. 問題なければ `--apply` で旧世代を削除する。
3. deploy workflow に「古い incremental-cache 世代の削除」を組み込む。

## すぐ削除しないもの

- `categories/all.json`: 現行 `packages/category` reader が使用中。
- `app/ranking-items/all.json`: 廃止予定だが、生成・運用系の参照が残る。
- `app/correlation/*`: ランキングページの相関セクションで使用中。
- `app/stats/*`: 観測値 SSOT。
- `gis/*`, `ges/*`, `sns/*`, `video/*`: Web runtime とは別用途。容量は大きいがライフサイクル設計を分けて判断する。
