# 地域プロファイル（web）

## 概要

`/areas` の都道府県選択ハブと、`/areas/[areaCode]` 以下の地域プロファイルを所有するfeature。
公開アプリは完全DBレスで、地域プロファイルはR2 snapshotから読む。

## `/areas` 都道府県選択ハブ

目的の県へ一操作で移動できることを主目的とし、入口の優先順位を「検索 → 一覧 → 地図」とする。

- routeはServer Componentを維持し、`PageShell`の左レール、`Breadcrumbs`、`PageHeader`、`AreaDirectory`を構成する。
- レール表示幅では地方フィルタを`AreaDirectoryRegionNav`として左に置き、末尾広告を本文カラム幅に収める。レール未表示幅では本文の全県一覧を代替導線とする。
- `AreaSearch`は県名のsuffix省略検索、候補表示、キーボード操作、直接遷移を担うClient Component。
- desktopは`AreaSelectionPanels`で軽量タイル地図と地方別一覧を2ペイン表示し、左レールの地方選択を一覧へ反映する。
- mobile/tabletは一覧を既定タブとし、地図は利用者が切り替えたときに表示する。
- `AreaTileMap`はD3やcanvasを使わず、通常の県リンクをCSS Gridへ配置する。初期HTMLに47県リンクを残す。
- `AreaDirectoryList`は地方別のsemantic listを描画し、各リンクの操作領域を44px以上にする。

### データSSOT

- 県名・県コード: `@stats47/area`の`fetchPrefectures()`
- 地方区分: `@stats47/area`の`REGIONS`
- タイル座標: `@stats47/visualization/d3/constants/tile-grid-layout`の`TILE_GRID_LAYOUT`
- joinと表示用データ生成: `utils/build-area-directory-data.ts`

県・地方・タイル座標をfeature内へ複製しない。旧Client-only D3選択地図を`/areas`へ戻さない。

### UI・アクセシビリティの不変条件

- 検索・一覧・地図はいずれも選択後に直接`/areas/<5桁code>`へ遷移する。
- 検索はvisible label、combobox/listbox semantics、Arrow keys、Enter、Escape、0件stateを持つ。
- 一覧と地図のリンクは`{都道府県名}の統計を見る`をaccessible nameにする。
- 地方はcategorical colorと地方名・凡例を併用し、色だけで区別しない。
- inactiveなmobile panelをfocus順へ残さない。
- canonical `/areas`、47件の`ItemList` JSON-LD、県URLを維持する。
- 県選択UIの途中へ広告を挿入しない。

### Analytics

既存`nav_click`を使用し、新しいイベントやcustom dimensionを増やさない。

| 導線 | `nav_surface`  |
| ---- | -------------- |
| 検索 | `areas_search` |
| 一覧 | `areas_list`   |
| 地図 | `areas_map`    |

県名は`nav_label`、遷移先は`nav_href`へ送る。計測失敗で遷移を止めない。登録状態の正典は
`.claude/rules/analytics-event-standards.md`。

## 地域プロファイル

- `actions/get-area-profile.ts`が`@stats47/area-profile/server`経由でR2 snapshotを読む。
- `AreaProfilePageClient`と各sectionが全国順位、強み・弱み、チャート、市区町村、関連記事を表示する。
- routeのServer Componentでデータを読み、serializableなpropsだけをClient Componentへ渡す。

## Public API

- client/shared export: `index.ts`
- server-only export: `server.ts`
- app層はfeature内部ファイルを直接importせず、原則としてこのbarrelを使う。

## 検証

```bash
npm run test:run --workspace apps/web -- src/features/area-profile
npm run type-check --workspace apps/web
npm run design-system:check --workspace apps/web
```

`/areas`の未完了QAと本番反映状況は
`.claude/todo/05_機能バックログ.md#AREAS-DIRECTORY-UX-01`を正典とする。
