---
paths:
  - "docs/31_note記事原稿/**"
  - ".claude/scripts/note/**"
  - ".claude/skills/note/**"
  - ".claude/agents/note-manager.md"
---
# note 原稿の画像・データ資産の置き場 (2026-09-29)

note 記事の画像は、記事で使ったデータと設定から作り直せる**派生物**である。派生物を git に置くと
リポジトリが肥大する (2026-09-29 の実測: `docs/31_note記事原稿/` の追跡 PNG 682 枚で約 153MB。
うち 519 枚 (約 140MB) は同名 SVG から再生成できた)。次の 3 層に分けて持つ。

| 層 | 置き場 | 中身 | 理由 |
|---|---|---|---|
| ① 原稿とデータ | git | `draft.md` / `chart-data.json` / `data-provenance.json` / `render-spec.json` / `tags.txt` / SVG | 小さく、差分をレビューでき、画像を作り直す入力になる |
| ② 派生画像 | git に置かない (gitignore) | SVG から作る PNG、ランキング記事の Remotion 画像 4 枚 | 再生成できる。復元コマンドがある |
| ②' 作り方の記録 | git | `render-spec.json` (ランキング記事) | `chart-data.json` の SHA・テンプレート版・色スケールを固定し、作り直しの根拠にする |
| ③ 公開時点の固定版 | R2 `note/<vertical>/<slug>/` (既存の `sync-note-r2`) | 公開した原稿一式 | 公開後の再現用。書込は CI のみ |

## 契約

1. **SVG から再生成できる PNG を追跡しない。** `docs/31_note記事原稿/` の PNG は、同名 SVG が追跡されていれば `.gitignore` の
   系列パターン (`a-kakei-*` / `b-kakei-*` / `koumuin-*`) が除外する。復元は
   `npm run note:images:regen -- --slug <記事ディレクトリ名>` (変換は `.claude/scripts/lib/svg-to-png.cjs` に一本化)。
   公開 (`/publish-note`) と `sync-note-r2` の前に、PNG が無ければ復元してから使う。
2. **無視される PNG には必ず再生成元を置く。** 再生成元は同名 SVG か、ランキング記事の `render-spec.json` + `chart-data.json`。
   どちらも無い PNG が無視されると git に載らず失われる。再生成元を持たない画像 (`product-sales`) は追跡のままにする。
3. **ランキング記事は `chart-data.json` と `data-provenance.json` だけでデータを復元できる。**
   `chart-data.json` は 47 行 (rank 1..47 の連番・area_code 47 種・数値 value)、`copy.{canonicalTitle,readerLabel,hook}`、
   `summary.{mean,stddev,topBottomRatio}`、**`unit`** (画像の再描画に必要。単位なしは空文字を明示) を持つ。
   `data-provenance.json` は `source` が R2 の `app/stats/<key>/values.json` を指し、`restore` を持つ。
   観測値の本体は R2 が SSOT で、ここはその記事が使った値の**固定コピー** (R2 の値が後で更新されても、公開時の数値を辿れる)。
4. **再生成元を持たない追跡 PNG は増やさない。** 追跡 PNG の総量は `.claude/config/note-image-assets-budget.json` の予算を超えない。
   予算は縮小専用で、下げるときは `npm run note:images:audit -- --write-budget`。増やす場合だけ `--allow-increase` を付け、理由をコミットに残す。
5. **画像の作り方を変えたら、既存記事の画像も作り直す。** テンプレートだけ直して過去記事を放置しない。

6. **「R2 に本文がある」はカタログの申告でなく実在で確かめる。** 2026-09-29 の実測で、`note-published-urls.json` が
   `r2_body:true` とする a-* 14 本の `draft.md` が R2 (`storage.stats47.jp/note/…`) に無く、git の `docs/31` が唯一の実体だった。
   原因は、カタログの `r2Body` 既定が `true` (「R2 に本体あり」) で、登録しただけで同期されないまま「保存済み」になっていたこと。
   該当 65 記事は `r2Body: false` にして `sync-note-r2` (CI) の対象へ戻した。以後は週次の `--verify-r2` が新しい欠落を止める。
   `r2BodyMissingKnown` (予算ファイル) は、直せない既知の欠落を一時的に許す縮小専用の一覧 (現在は空)。

## 機械検査 (`npm run note:images:audit`)

| コード | 意味 |
|---|---|
| `DERIVED_PNG_TRACKED` | 同名 SVG から再生成できる PNG を追跡している |
| `IGNORED_PNG_WITHOUT_SVG` | gitignore された PNG に再生成元の SVG が無い (作業ツリーでのみ検出) |
| `RANKING_CHART_DATA_INVALID` / `RANKING_PROVENANCE_INVALID` | 契約 3 の欠落 |
| `RENDER_SPEC_INVALID` | `render-spec.json` が無い・`chart-data.json` の SHA やテンプレート版が現行と不一致 (画像を作り直していない) |
| `TRACKED_PNG_OVER_BUDGET` | 追跡 PNG が予算を超えた |
| `NOTE_R2_BODY_MISSING` | `r2_body:true` の記事が R2 に無い (`--verify-r2`・ネットワーク要・週次のみ。通信失敗は 0 件扱いにせず exit 2) |

配線: pre-commit (`apps/web/scripts/pre-commit-checks.sh`)・PR (`pr-quality-check.yml`)・`.claude/config/quality-gates.json` の
`note-image-assets`・週次 (`note-circulation-audit-weekly.yml` の artifact `note-image-assets.json`)。
`/weekly-review` は `npm run note:images:audit -- --json` の `summary` を読む。
既存の `check-asset-policy.cjs` は、`docs/31` の派生 PNG が CI checkout に無いことを欠落 (`MISSING_REFERENCE`) と扱わない。

## ランキング記事の画像 4 枚 (cover / choropleth / chart / boxplot)

`node .claude/scripts/note/render-ranking-images.mjs <rankingKey>` が `chart-data.json` だけから 4 枚を作り、`render-spec.json` を書く
(`--all` 全記事 / `--stale` 古い記事だけ / `--check` 検査のみ)。R2 や `.local` のデータは読まない。

- テンプレートは `apps/remotion/src/features/ranking-note/` (note 専用)。X・Instagram と共有する `ranking-x/` は変えない
  (`RankingBoxplot` にだけ opt-in の `marginLeft` / `niceTicks` を足した。省略時は従来と同じ出力)。
- **色は値でなく順位で決める。** 値で塗ると、東京都・北海道のような外れ値が 1 県あるだけで残り 46 県が同じ薄い色になる。
- props 欠落時は別指標のモックに落ちず例外にする (他記事のデータで画像が焼かれる事故を防ぐ)。
- **見た目を変えたら** `.claude/scripts/note/lib/note-render-spec.mjs` の `NOTE_RENDER_TEMPLATE_VERSION` を上げ、
  `render-ranking-images.mjs --stale` で全記事を作り直す。上げ忘れても、古い spec は `RENDER_SPEC_INVALID` で止まる。
- カバー (1280x670) の正典は、新規記事の公開時に使うこの Remotion 版。公開済み記事のカバー一括差し替えは
  `NOTE-COVER-ROLLOUT-20260928` (Satori 版・別系統) が持ち、`production-manifest` が実際に note へ載せる画像を決める。

