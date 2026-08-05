# Topic — カテゴリ内グループ分類の SSOT

`/category/<key>` の一覧を「意味のあるまとまり」で束ねるためのラベル軸。
例: 労働・賃金の 110 件を「職業別の平均年収 / 生活時間 / 賃金・給与 / …」に分ける。

## なぜ第四の軸を足したか

`docs/01_技術設計/03_情報設計.md` は Category / Theme / Tag の三軸を正典とし、
第四軸の追加には「既存三軸で表現できない根拠のレビュー」を求めている。
topic が **Category 軸の内部整理であって新しい分類軸ではない**根拠は 3 点:

1. **URL を持たない** — `/topic/<key>` は作らない。category ページ内の見出しに閉じる
2. **category の従属属性** — 1 metric は 1 category 文脈につき 1 topic (関数従属)。
   複数 topic に属させると Tag と機能が重複するため禁止
3. **描画物を持たない** — theme (`/themes/*`) が「複数指標の解釈 + curated チャート」で
   URL とチャートを持つのに対し、topic は索引の可読性のためのラベルにすぎない

背景となった実測 (2026-08-05): `/category/laborwage` は 110 件を平坦なテーブルで見せており、
うち 48 件 (19 タイトル) は同名で subtitle だけが違うため、一覧として区別がつかなかった。

## 既存 `groupKey` との違い (混同注意)

`MetricConfig.groupKey` は「同一指標の別カット (男女別・正規化違い) を束ねる」用途で、
値は代表 metric の key と一致させる規約。2295 件中 295 件のみが保持し、粒度は数件単位。
`is-base-metric.ts` の派生判定と sidebar の間引きが依存しているため、
**意味を上書きすると配信が壊れる**。topic はその上位レイヤで、別フィールド・別名。

## 構成

| ファイル | 役割 |
|---|---|
| `types.ts` | `TopicMatcher` / `TopicDef` / `CategoryTopicCatalog` / 予約語 `other` |
| `resolve-topic.ts` | `resolveTopicKey()` — 解決の唯一の実装 (純関数) |
| `from-metric.ts` | `MetricConfig` → 解決入力。家計調査 `cdCat01` の取り出しもここ |
| `catalogs/<categoryKey>.ts` | カテゴリごとのカタログ (17 件) |
| `index.ts` | レジストリ `CATEGORY_TOPIC_CATALOGS` |

## 解決順

1. `overrides[metricKey]` — 規則で拾えない / 誤分類されるものの個別指定
2. `topics[].matchers` を**配列順に評価し先勝ち** — 広いパターンは後ろに置く
3. `other` (その他) — 受け皿。カタログでの定義は禁止 (validator error)

## matcher の種類

| kind | 用途 |
|---|---|
| `title` | ランキング名の正規表現一致。ほとんどのカテゴリはこれ |
| `kakei-cat01` | 家計調査の品目コード前方一致。**economy 専用** |

`kakei-cat01` があるのは、economy の 694 件が家計調査品目でタイトルの語彙
(「りんご」「もやし」…) では 58% しか割れないため。コードは階層構造を持ち、
先頭 2 桁が 10 大費目 (01 食料 / 04 家具・家事用品 / 08 教育 …)、
続く 2 桁が中分類 (0102 魚介類 / 0105 野菜・海藻 / 0111 酒類 …)。
食料だけで 336 件あるため、**食料のみ中分類 12 群に割り、他 9 大費目は 1 群ずつ**にしている。

## 編集手順

```bash
# 1. カタログを編集
# 2. 検証 (error は CI / pre-commit をブロック)
npm run validate:topics --workspace=@stats47/data-configs
# 3. 分類結果のテスト
npx vitest run --root packages/data-configs src/topics
```

**カタログを変えても本番はすぐには変わらない。** topic は R2 の
`app/category/<key>/items.json` へ焼き込まれるため、`sync-snapshots` の
`ranking-items` task で再生成する必要がある。

## 分類済み率 (2026-08-05 実測)

全 17 カテゴリ・active metric 2202 件のうち **91%** が `other` 以外に分類される。
残りは受け皿でよい (ユーザー判断)。無理に細分化して規則を複雑にしない。

低カバレッジ (50% 未満) は validator が warn を出す。カタログを足したのに
規則がほとんど効いていない状態を検出するための床。
