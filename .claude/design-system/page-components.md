# ページコンポーネント設計ガイド

## Single Source of Truth

永続 DB は使わない。ページコンポーネントの正典と配信経路は次のとおり。

| 対象                                 | SSOT                                                          | 生成物 / 配信                                                 |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Theme                                | `packages/data-configs/src/theme-catalog/<key>.ts`            | `apps/web/scripts/data/page-components/theme/<key>.json` → R2 |
| Area / Area category / City category | `apps/web/scripts/data/page-components/<pageType>/<key>.json` | 同一 byte を R2 へ配信                                        |
| Area databook                        | `packages/data-configs/src/area-databook/`                    | area page-components JSON → R2                                |

Theme の生成済み JSON は手編集しない。編集後は
`npm run generate:catalog --workspace=@stats47/data-configs` と
`npm run validate:catalog --workspace=@stats47/data-configs` を実行する。
R2 反映は `apps/web/scripts/export-page-components-snapshot.ts` が担当する。

## PageComponent contract

各行は少なくとも次を持つ。

| field                            | 用途                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `componentKey` / `componentType` | 一意な識別子と描画型                                       |
| `title`                          | 可視化の短い見出し                                         |
| `description`                    | 読者向けの「何が分かるか / どう読むか」。可視 chart は必須 |
| `componentProps`                 | statsDataId、系列、ラベル、色 role 等                      |
| `sourceName` / `sourceLink`      | 出典                                                       |
| `rankingLink`                    | 対応する単一指標ランキング                                 |
| `gridColumnSpan* `               | レスポンシブ配置                                           |
| `section` / `sortOrder`          | グループと表示順                                           |

ThemeCatalog の `charts.description` は個別の説明を上書きする。未指定時も
`resolveChartDescription` が component type 別の標準文を決定的に生成し、配信 JSON へ書き出す。
`metrics.selection.rationale` は内部 provenance であり、読者向け description として表示しない。

## pageType の責務

配置判断の正典は
[`docs/01_技術設計/03_情報設計.md`](../../docs/01_技術設計/03_情報設計.md)。

| pageType        | 置く情報                                   | 置かない情報                           |
| --------------- | ------------------------------------------ | -------------------------------------- |
| `theme`         | 47都道府県横断でテーマを説明する指標・関係 | 一県だけの事情、公式全国値だけの chart |
| `area`          | 一地域のプロフィール、他地域との差         | 全国テーマの一般説明だけの chart       |
| `area-category` | 地域 × 統計分類として意味がある比較        | 全国値の無条件な複製                   |
| `city-category` | 市区町村の統計主体・定義で成立する比較     | 都道府県用 statsDataId の流用          |

市区町村と都道府県は entity と statsDataId が異なる。サービス層で暗黙変換せず、
各カタログ / pageType が正しい参照を持つ。日本の公式全国値は `/japan/*` の別契約で扱い、
47県平均を page-components から全国値として作らない。

## 1データ1コンポーネント原則

同じ統計・同じ entity・同じ表現は既存 component を再利用する。ページごとに chart key、
chart type、色、ラベルを複製しない。ただし地理粒度や統計主体が異なる場合は別定義にする。

## 読者向け表示契約

各 `ChartPanel` は次を近接して表示する。

1. title
2. 1〜2文の reader description
3. chart / legend / axis
4. 年度・単位・出典・注意事項・ranking link

ページ header に全 chart の説明をまとめたり、ページ末尾だけに出典を集約したりしない。
同じ事実を KPI card と chart で二度強調せず、値・比較・推移・構成の役割を分ける。

## 色

ThemeCatalog は `chart-color-role.ts` の role を持ち、generator が配信用の色へ解決する。
ThemeCatalog の色 field に生の hex / rgb / hsl を書かない。性別等の意味色と可読性は
`.claude/rules/chart-component-standards.md` に従う。

## 機械検証

- `generate:catalog --check`: ThemeCatalog と生成物の drift
- `validate:catalog`: key、props、link、reader description、evidence の整合
- `apps/web/scripts/check-design-system.mjs`: layout / focus / surface の禁止パターン
- `npm run type-check --workspace apps/web`: reader 型と renderer の整合

## 禁止事項

- 永続 D1 / table を page-components の SSOT とする
- Theme の生成済み JSON を手編集する
- page / component 内へ chart 定義をハードコードする
- 可視 chart を description 無しで配信する
- 47県 chart を市区町村・日本へ無条件に複製する
- ThemeCatalog の内部 selection rationale を読者 UI へそのまま露出する
