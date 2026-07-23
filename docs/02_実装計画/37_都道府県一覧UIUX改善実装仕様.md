---
type: implementation-spec
date: 2026-07-23
status: active
tags: [areas, ui, ux, accessibility, analytics, responsive]
---

# 都道府県一覧 `/areas` UI/UX 改善実装仕様

## 0. 文書の位置づけ

本書は `/areas` を「地図が置かれたリンク一覧」から「目的の都道府県へ最短で到達できる地域選択ハブ」へ改善する恒久実装仕様である。

- 実装担当: Claude Code
- 対象: `apps/web` の `/areas` と、選択UIに必要な feature-local component / analytics / test
- TODO真実源: `docs/todo/02_機能バックログ.md#AREAS-DIRECTORY-UX-01`
- UI正典: `docs/01_技術設計/15_デザインシステムSSOT.md`
- レイアウト正典: `docs/01_技術設計/13_統一レイアウト設計.md`
- 情報設計正典: `docs/01_技術設計/07_情報設計.md`

本書は一時ハンドオフではない。実装後も現在仕様と判断根拠を残す。実装中の残タスクは新しい一時文書を作らず、機能バックログへ直接反映する。

## 1. 結論

採用案は以下で固定する。

1. 検索を最速の第一入口にする。
2. デスクトップは「軽量タイル地図 + 地方別ディレクトリ」の2ペインにする。
3. モバイルは押しやすい地方別一覧をデフォルトにし、地図は任意切替にする。
4. 現在のD3 Client-only地図を、SSR可能なリンクベースの軽量SVGまたはCSSグリッドへ置き換える。
5. 地方区分には連続色を使わず、カテゴリ色 + 地方名/テキストを併用する。
6. 47枚の大型カード、観光写真、AI画像、暗色hero、現在地取得は導入しない。
7. 選択経路を `search / map / list` に分けて計測する。

ページの仕事は統計を大量表示することではない。ユーザーが目的の県を見つけ、`/areas/[areaCode]` へ迷わず進むことが唯一の主目的である。

## 2. 現状と問題

### 2.1 現行実装

- route: `apps/web/src/app/areas/page.tsx`
- map: `apps/web/src/features/area-profile/components/AreaSelectorMap.tsx`
- prefecture / region data: `@stats47/area` の `fetchPrefectures()` / `REGIONS`
- outer layout: `PageShell`、最大1280px
- map implementation: `TileGridMap` を `next/dynamic({ ssr: false })` で読み込むD3 Client Component

### 2.2 問題一覧

| 問題 | 現状 | 影響 |
|---|---|---|
| 初期空白 | mapがSSRされず、aspect領域だけ予約される | 地図が壊れているように見える。JS依存 |
| 小さいタップ領域 | モバイルで47タイルを1画面幅へ縮小 | 読みにくい・押し間違い |
| 色の誤読 | 地方indexへ連続色 `interpolateSpectral` | 数値の大小を表す地図に見える |
| 機能重複 | 地図と地方別テキスト一覧が同時に同じ遷移を提供 | 視線の優先順位が不明 |
| 直接検索なし | 県名が決まっていても一覧から探す | 選択まで遅い |
| 価値説明不足 | 「特徴を見る」だけ | 遷移後に何があるか不明 |
| affordance不足 | 県名がplain text link | クリック可能性・範囲が弱い |
| header不統一 | 独自 `text-lg` h1 | サイトのPageHeader規約と不整合 |
| mobile遮蔽 | 固定Cookieバナーが最初の地域一覧へ重なる | 選択操作を阻害（global課題として分離） |

### 2.3 実画面確認の基準

2026-07-23時点の本番を基準とする。

- desktop: 地図が左約480px、地方一覧が右2列。初期描画直後は地図が空白になり得る。
- mobile 390px: 地図が先に大きく表示されるが、各県タイルは小さい。地方一覧はその後ろへ長く積まれる。
- ページ上部にパンくず・検索・選択方法の切替がない。

実装前に必ず最新本番とlocalhostを再確認し、別セッションの変更が入っていれば本書との差分を報告してから調整する。

## 3. 類似サービス分析

### 3.1 RESAS

- URL: `https://resas.go.jp/`
- 地域選択例: `https://resas.go.jp/region-cycle-diagram/`
- 採用する考え方:
  - 「地域を選択する」→「分析する」の操作順が明確。
  - 都道府県単位 / 市区町村単位の責務を分離する。
- 採用しないもの:
  - 多段の分析条件UI。
  - `/areas` にテーマ・年度・指標選択まで載せること。

### 3.2 Data Commons Place Explorer

- URL: `https://datacommons.org/place`
- 採用する考え方:
  - 場所名検索を主入口にする。
  - 検索以外にも代表的な地域候補を提示する。
  - 選択後に何が分かるかを説明する。
- 採用しないもの:
  - 国・州・郡・市を同一検索空間へ混在させること。

### 3.3 Data Commons Map Explorer

- URL: `https://datacommons.org/tools/map`
- 採用する考え方:
  - 地図だけに操作を依存しない。
  - location / breakdown / variable の責務を分ける。
- 採用しないもの:
  - `/areas` で指標選択まで行うこと。

### 3.4 e-Stat 統計ダッシュボード

- URL: `https://dashboard.e-stat.go.jp/dataSearch?language=ja`
- 採用する考え方:
  - 地域選択を独立した明示工程にする。
  - 都道府県一覧と市区町村一覧を分ける。
- 採用しないもの:
  - 大量のselectと複数選択boxを持つ高密度フォーム。

### 3.5 Stats47としての差別化

政府系ツールより選択を軽くし、一般ユーザーが県名を選ぶだけで以下へ到達できることを強みにする。

- 全国順位
- 地域の強み・弱み
- 人口・産業・暮らし等の主要統計
- 県内市区町村
- テーマ別の深掘り

## 4. UX原則

### 4.1 ユーザー意図

| ユーザー | 意図 | 最短経路 |
|---|---|---|
| 県名が決まっている | 「東京都を見たい」 | 検索 → Enter |
| 場所は分かる | 「地図から九州の県を選びたい」 | 地図 → 県リンク |
| 地方から探す | 「東北の県を見比べたい」 | 地方filter / 地方別一覧 |
| 何が見られるか知りたい | 「県ページの内容を知りたい」 | PageHeader説明 → 選択 |
| キーボード利用 | TabとEnterで選びたい | 検索またはリンク一覧 |
| JS失敗時 | それでも県ページへ進みたい | SSR link一覧 / SVG links |

### 4.2 優先順位

1. 検索
2. 一覧
3. 地図

見た目の主役と機能の主役を混同しない。地図はブランド上の視覚的入口として重要だが、操作の確実性では検索と一覧を優先する。

### 4.3 一操作一結果

- 検索候補の選択 → 直接県ページへ遷移。
- 一覧リンク → 直接県ページへ遷移。
- 地図タイル → 直接県ページへ遷移。
- 県を一度選び、さらに「見る」ボタンを押す2段階previewは採用しない。

## 5. 情報設計

ページの順序を以下に固定する。

1. `Breadcrumbs`
2. `PageHeader`
3. 都道府県検索
4. 選択UI（desktop 2ペイン / mobile tabs）
5. 県ページで得られる内容の短い補足（必要なら選択UI見出し内に統合）
6. `InContentAdSlot` または現行広告（広告規約に従い、選択UIを分断しない）
7. `FooterAdSlot` または既存末尾枠

### 5.1 文言

- eyebrow: `エリア` または省略
- h1: `都道府県から統計を見る`
- description: `47都道府県の全国順位、地域の強み・弱み、人口・産業・暮らしの統計を確認できます。`
- selection h2: `都道府県を選ぶ`
- search label: `都道府県名を検索`
- search placeholder: `例：東京都`
- map tab: `地図から探す`
- list tab: `一覧から探す`
- prefecture accessible label: `{prefName}の統計を見る`

「地図をクリックして」のように入力方法を1つへ限定する説明は使わない。

## 6. レスポンシブレイアウト

### 6.1 Desktop（lg以上）

```text
Breadcrumb

都道府県から統計を見る
説明

都道府県を選ぶ
[ 検索 ................................................ ]

┌────────────────────────┬─────────────────────────────┐
│ 軽量タイル地図          │ 地方filter                  │
│                        │ [すべて][北海道・東北]...   │
│ 地方名 + 県名           │                             │
│ link                    │ 北海道・東北                │
│                        │ [北海道 →] [青森県 →] ...   │
│                        │ 関東                        │
│                        │ [茨城県 →] [栃木県 →] ...   │
└────────────────────────┴─────────────────────────────┘
```

- outer widthは `PageShell` の1280pxを維持する。
- page.tsxで別の外側max-widthを追加しない。
- 2ペインはページ内容の内部gridとして許容する。
- 推奨比率: map `minmax(0, 520px)` / directory `minmax(0, 1fr)`、gap 32px。
- 地方filterは一覧の絞り込みであり、URLやSEOページを新設しない。

### 6.2 Tablet（md〜lg未満）

- 検索を全幅表示。
- 一覧を先、地図を後、またはmobileと同じtabsにする。
- 2カラムにして県リンクが狭くなる場合は無理にdesktop gridを維持しない。

### 6.3 Mobile（md未満）

```text
都道府県を選ぶ
[ 都道府県名を検索          ]

[ 一覧から探す ] [ 地図から探す ]

北海道・東北
[ 北海道                         → ]
[ 青森県                         → ]
...
```

- default tabは `一覧から探す`。
- link rowの高さは最低44px、推奨48px。
- 地図は選択された時だけ表示してよいが、初回表示用bundleへ不要なD3を含めない。
- Cookie bannerとの重なりはglobal componentの既存変更を確認する。本タスクで修正する場合は、`/areas` 専用hackにせずglobalの安全な縮約として別diff・別テストにする。

## 7. コンポーネント設計

### 7.1 推奨構成

最終的な名前は既存命名と衝突しない範囲で調整可。

```text
apps/web/src/features/area-profile/components/
  AreaDirectory.tsx               # server wrapper / data整形
  AreaSearch.tsx                  # client: combobox + navigation + analytics
  AreaDirectoryList.tsx           # server or presentational: region groups
  AreaTileMap.tsx                 # SSR可能な軽量map
  AreaDirectoryMobile.tsx         # client: tabsが必要な場合のみ
  __tests__/
```

既存のbarrel export `apps/web/src/features/area-profile/index.ts` を使う。app層からfeature内部ファイルへ直接importしない。

### 7.2 Server / Client境界

- `AreasPage`: Server Component維持。
- `AreaDirectoryList`: 原則Server/presentational。
- `AreaTileMap`: link-onlyならServer Component。
- `AreaSearch`: input state、候補filter、router navigationのためClient Component。
- mobile tabs: CSSだけで安全に実現できなければ小さなClient Component。
- ページ全体をClient Componentにしない。

### 7.3 データSSOT

- prefecture: `fetchPrefectures()`
- regions: `REGIONS`
- 県名・コード・地方構成を新しい配列へ複製しない。
- map座標が既存visualization packageにある場合は再利用する。
- 座標SSOTがない場合のみ、型付きgit TSの最小layout定義を `@stats47/area` またはarea-profile featureに置く。page.tsxへ座標を直書きしない。
- mapとlistは同じprefecture/region sourceから生成する。

## 8. 検索仕様

### 8.1 UI

`@stats47/components` に利用可能な `Command` / `Popover` / `Combobox` / `Select` があるか実装前に確認する。

優先順位:

1. 既存のアクセシブルなCombobox composite
2. `Popover + Command`
3. `Command` 単体
4. 最小のinput + listbox（ARIAを正しく実装できる場合のみ）

素の `<select>` や自作の不完全なautocompleteを先に選ばない。

### 8.2 matching

- 完全な県名: `東京都`
- suffix省略: `東京`
- ひらがな検索は既存データにreadingがある場合のみ対応。
- ローマ字・曖昧検索・市区町村検索は今回追加しない。
- 0件時は `該当する都道府県がありません`。
- 最大47件なのでdebounceや外部search APIは不要。

### 8.3 keyboard

- input focus → ArrowDownで候補へ
- ArrowUp/Downで移動
- Enterで県ページへ
- Escapeで閉じる
- Tab順を壊さない
- active descendant / label / expanded stateをprimitiveへ委ねる

### 8.4 navigation

- linkベースで実現できるprimitiveならNext `Link` を使う。
- `onValueChange` しかない場合は `router.push('/areas/' + areaCode)`。
- `window.location` は使わない。

## 9. 軽量タイル地図仕様

### 9.1 D3を外す理由

選択用地図にはscale、axis、zoom、tooltip、data join等が不要である。Client-only D3は以下のコストが勝る。

- SSR不可による初期空白
- hydration待ち
- bundle増加
- JavaScript失敗時のリンク消失
- 小さいタイルへ縮小されるmobile UX

既存 `TileGridMap` は統計値を可視化するチャートとして残す。選択UIから外すだけで、visualization package自体を削除・改変しない。

### 9.2 実装方式

次のいずれかをコード監査後に選ぶ。

- 推奨A: CSS Gridに県リンクを配置
- 推奨B: inline SVG内の `<a href>` + `<rect>` + `<text>`

選択基準:

- SSR HTMLに全47県リンクが存在する。
- keyboard focusが見える。
- accessible nameが取れる。
- mobileで地図を横スクロールさせず収められる。
- `dangerouslySetInnerHTML` を使わない。

### 9.3 色

- 地方は順序を持たないためcategorical paletteを使用。
- semantic tokenまたは既存chart paletteから、light/dark双方で区別可能な低彩度色を選ぶ。
- 県名文字とのcontrastを確認する。
- 色だけに依存せず、地図付近に地方名またはlegendを置く。
- `interpolateSpectral` と「地域indexをvalueにする」実装は削除する。

### 9.4 interaction

- click/tap → 直接遷移。
- hover/focus → border/outline/背景の変化。
- hoverだけのtooltipへ県名を隠さない。
- active/current stateは不要（一覧ページでは未選択）。

## 10. 地方別ディレクトリ仕様

### 10.1 desktop

- 地方ごとにsection + h3。
- 県リンクは2〜3列。コンテナ幅に応じて決める。
- plain inline textではなく、行または小さなlink surfaceとしてクリック範囲を確保する。
- 47枚の説明カードにはしない。
- arrow iconは装飾なら `aria-hidden`。

### 10.2 filter

- `すべて` + `REGIONS` の地方名。
- defaultは `すべて`。
- filter変更で該当地域だけ表示。
- query parameterは不要。戻る操作やshare対象ではない軽量view stateとする。
- mobile tabsと地方filterが二重に見える場合は、mobileでは地方filterを横scroll chipsにせず、地方sectionをそのまま縦表示する。

### 10.3 semantic HTML

- directory全体: `<nav aria-label="都道府県一覧">`
- region: `<section aria-labelledby>` またはlist内group
- prefectures: `<ul><li><Link>`
- visual gridのためだけにsemantic listを失わない。

## 11. Analytics

### 11.1 方針

新しいイベントを乱立させず、まず既存 `nav_click` を再利用できるか確認する。

推奨payload:

```ts
trackNavClick({
  label: prefectureName,
  href: `/areas/${areaCode}`,
  surface: `areas_${source}`,
});
```

`source`:

- `search`
- `map`
- `list`

既存関数の型や命名が異なる場合は実コードへ合わせる。`nav_label` / `nav_surface` は2026-07-20にGA4登録済みなので、原則として新しいcustom dimensionを増やさない。

### 11.2 実装ルール

- event定義のSSOTは `apps/web/src/lib/analytics/events.ts`。
- 登録状況は `.claude/rules/analytics-event-standards.md`。
- analytics失敗でnavigationを止めない。
- impression eventは今回不要。ページviewとclickで選択率を算出する。
- `areaCode` を追加paramにする必要がある場合は、custom dimension枠と利用目的を明示し、台帳を更新する。推奨は既存label/hrefだけで足りる設計。

### 11.3 KPI

- `/areas` page view → `/areas/[code]` click率
- source別click数/率
- device別click率
- 選択までの時間（必要なら後続。初期実装でtimer eventは増やさない）
- zero-interaction exit率
- LCP / CLS / INP

## 12. Accessibility

完了条件:

- h1はページに1つ。
- `PageHeader` のh1を利用。
- searchにvisible labelまたは適切なaccessible label。
- 全47県へkeyboardだけで到達可能。
- focus indicatorが見える。
- mapとlistの両方で同じ県名がaccessible treeへ現れることは許容するが、mobileで非表示のpanelはfocus不能にする。
- `display:none` / Radix tabs等でinactive panelを正しく除外する。
- linkのaccessible nameは県名 + 目的が分かる。
- 44px以上のmobile target。
- 地方色だけで分類しない。
- dark modeでもcontrastを保つ。
- prefers-reduced-motionで不要なanimationを行わない。

## 13. SEO・構造化データ

- canonical `/areas` を維持。
- `ItemList` JSON-LDの47県を維持。
- 県URLを変えない。
- sitemap / middleware / robotsを変更しない。
- h1文言変更に合わせてmetadata title/descriptionが不自然でないか確認する。
- 検索候補だけにリンクを閉じ込めず、SSRされた47県リンクを保持する。
- 地方filterによってcrawlerから県リンクが消えない構造にする。初期HTMLは全県を含む。

## 14. 広告

- 県選択UIの途中に広告を挿入しない。
- 現行末尾広告のslot重複・空白を確認する。
- 可能なら標準 `FooterAdSlot` / `InContentAdSlot` へ既存規約どおり寄せるが、広告施策の効果測定を壊す変更は同時に行わない。
- 広告slot IDやAdSense設定を変更しない。
- Cookie bannerの全サイト再設計は別責務。選択UIを覆う明確な回帰だけを報告する。

## 15. 実装Phase

Claude Codeは計画提示だけで停止せず、Phase 0〜6を順に実行する。

### Phase 0 — 競合・現状・dirty tree再確認

1. `git status --short`。
2. `CLAUDE.md` と必読文書を読む。
3. `/areas`、`AreaSelectorMap`、`TileGridMap`、`@stats47/area` exports、analytics、UI primitives、既存testを読む。
4. 他セッションの変更を特定し、重複/競合ファイルを勝手に修正しない。
5. productionとlocalhostをdesktop/mobileで撮影または確認する。
6. Phase 1のfile boundaryを短く報告して実装へ進む。

### Phase 1 — Page structure

1. `Breadcrumbs` を追加。
2. `PageHeader` へ統一。
3. h1 / descriptionを本書の文言へ更新。
4. 選択sectionをsemanticに構築。
5. JSON-LDを維持。

### Phase 2 — Search

1. 既存primitiveでaccessible prefecture comboboxを作る。
2. suffix省略matchingを決定的関数として分離。
3. keyboardと0件stateを実装。
4. selected prefectureへnavigation。
5. search click analytics。

### Phase 3 — Directory

1. regionごとのsemantic listを実装。
2. desktopの押しやすい2〜3列layout。
3. 必要ならdesktopだけregion filter。
4. list click analytics。
5. map/listが同じdata SSOTを使うことをtest。

### Phase 4 — Lightweight map

1. SSR link mapを実装。
2. current D3 dynamic importを `/areas` 選択UIから撤去。
3. categorical palette + label/legend。
4. focus / hover / dark mode。
5. map click analytics。
6. `AreaSelectorMap` が未使用ならexportとファイルを削除。ほかに利用があれば破壊しない。

### Phase 5 — Responsive and accessibility

1. mobile default=list、mapは任意切替。
2. 390 / 768 / 1024 / 1280 / 1440pxを確認。
3. keyboard、focus、screen reader semantics、target size。
4. light / dark。
5. JS無効またはhydration前にも47県linkが存在することを確認。

### Phase 6 — Tests, docs, cleanup

1. unit/component test。
2. type-check。
3. design-system check。
4. targeted accessibility / Playwright test。
5. localhost visual check。
6. unused import/component/exportを削除。
7. 本書と `docs/todo/02_機能バックログ.md` のstatusを実装結果へ更新。
8. 完了済みbacklog sectionは運用ルールに従って削除してよいが、本書は恒久仕様として残す。
9. commit / push / PR / deployは行わない。

## 16. テスト仕様

### 16.1 pure unit

- `東京` が東京都にmatchする。
- `東京都` が東京都にmatchする。
- 空文字は全件または候補非表示（採用UIに合わせる）。
- 存在しない文字列は0件。
- map/listで47県が一意。
- REGIONSの全prefecture codeとfetchPrefecturesが一致。
- area URLが `/areas/{5桁code}`。

### 16.2 component

- h1 / description / search label。
- 現在候補の表示。
- keyboardで候補選択。
- list link href。
- map link href / accessible name。
- mobile default tabがlist。
- inactive mapがfocus順に入らない。
- analytics sourceが search / map / list で正しい。
- analytics mock失敗でもlink/navigationが成立。

### 16.3 route / SSR

- initial HTMLに47県linkが存在。
- ItemList JSON-LDが47件。
- canonical不変。
- client-only D3 chunkが `/areas` の初期依存に残らないことを、可能ならbundle/import testまたはsource testで確認。

### 16.4 visual / E2E

viewport:

- 390 × 844
- 768 × 1024
- 1024 × 768
- 1280 × 900
- 1440 × 1000

確認:

- horizontal overflowなし。
- search popupがviewport外へ出ない。
- mobile targetが押せる。
- map/list切替後もlayout jumpが過大でない。
- header、footer、Cookie bannerとの重なり。
- light / dark。
- console error / hydration error 0。
- 地図が初回HTMLから見える。

## 17. 検証コマンド

実際のscript名はpackage.jsonを確認し、存在するものだけを実行する。推奨順:

```bash
git status --short
rg -n "AreaSelectorMap|TileGridMap|/areas/" apps/web/src packages
npm run test:run --workspace apps/web -- <追加・変更した対象test>
npm run type-check --workspace apps/web
npm run design-system:check --workspace apps/web
git diff --check
```

route / SSR / bundleへの影響が大きい場合:

```bash
npm run build --workspace apps/web
```

本番へアクセスするsmoke testやR2 writeは不要。full buildを省略した場合は理由を最終報告に記載する。

## 18. 成功条件

すべて満たしたときだけ完了とする。

- [ ] `Breadcrumbs` + `PageHeader` に統一。
- [ ] 検索から県ページへ移動できる。
- [ ] desktopにmap + directoryの明確な2ペインがある。
- [ ] mobileはlistがdefaultで、44px以上のlink targetを持つ。
- [ ] 地図がSSRされ、初期空白がない。
- [ ] `/areas` がD3 Client-only地図へ依存しない。
- [ ] 連続色を使わず、地方区分を色以外でも示す。
- [ ] 全47県がmap/list双方で正しいURLへlinkする。
- [ ] keyboardだけで検索・一覧・地図を操作できる。
- [ ] JS/hydration前でも47県linkが存在する。
- [ ] `search / map / list` の選択経路が既存analytics規約で計測される。
- [ ] JSON-LD / canonical / sitemap方針が壊れていない。
- [ ] mobile/tablet/desktop、light/dark、Cookie banner表示時を確認。
- [ ] unit/component test、web type-check、design-system checkが成功。
- [ ] console / hydration error 0。
- [ ] 不要になった旧component/export/importを削除。
- [ ] 本番deployをしていない。

## 19. スコープ外

- `/areas/[areaCode]` の全面再設計
- 市区町村横断検索
- GPS / Geolocation
- 県の人気順・おすすめ順
- 最近見た県のlocalStorage保存
- 2県比較フローの新設
- 観光写真・AI画像・都道府県旗の追加
- 日本列島polygon mapへの置換
- R2 schema / snapshot変更
- URL / middleware / canonical変更
- AdSense slot変更
- 全サイトCookie banner再設計
- production deploy

## 20. 禁止事項

- page全体をClient Component化する。
- 県・地方の配列を複製する。
- 47枚の大型カードを作る。
- map選択後にもう一度CTAを押させる。
- colorだけで地方を区別する。
- hover tooltipだけに県名を置く。
- raw hexや強いshadow、`rounded-xl/2xl`を乱用する。
- 独自heroを追加する。
- `container mx-auto` / 独自outer max-widthを追加する。
- analyticsのためにnavigationを遅延する。
- 存在しないGA4 custom dimensionを登録済みと記録する。
- 別セッションのdirty filesを整形、削除、stash、commitする。
- commit、push、PR、R2 write、deploy。

## 21. Claude Codeへの貼り付けプロンプト

以下をClaude Codeの新規セッションへそのまま貼り付ける。

```text
OUTPUT FORMAT:
- 最初に「実装する結果 / 対象Phase / 既存dirty変更との境界」を最大8項目で報告する。
- 各Phase終了時に「変更ファイル / 検証結果 / 残り」を簡潔に報告する。
- 最終報告は「実装結果 / UX上の変更 / Analytics / 検証 / 未実行 / 変更ファイル」の6節にする。
- 未検証・fallback・失敗を完了扱いしない。

BEHAVIOR CONTRACT:
- 計画だけで停止せず、Phase 0〜6と成功条件をすべて消化するまで実装・検証を続ける。
- 書く前に既存exports、呼び出し元、UI primitive、analytics、testを読む。
- 変更は /areas UI/UX改善に限定し、別セッションのdirty fileを編集・整形・削除・stashしない。
- 既存規約と共有componentを優先し、県・地方データを複製しない。
- 外部公開操作は行わない。commit / push / PR / R2 write / deployは禁止。

TASK:
まず `CLAUDE.md` と `docs/02_実装計画/37_都道府県一覧UIUX改善実装仕様.md` を全文読み、同仕様を今回の実装要件として `/areas` のUI/UX改善を最後まで実装してください。

必ず先に以下を確認してください。

- `git status --short`
- `.claude/rules/ui-components.md`
- `.claude/rules/coding-standards.md`
- `.claude/rules/analytics-event-standards.md`
- `docs/01_技術設計/07_情報設計.md`
- `docs/01_技術設計/13_統一レイアウト設計.md`
- `docs/01_技術設計/15_デザインシステムSSOT.md`
- `apps/web/src/app/areas/page.tsx`
- `apps/web/src/features/area-profile/components/AreaSelectorMap.tsx`
- `apps/web/src/features/area-profile/index.ts`
- `packages/visualization` の `TileGridMap` 実装
- `@stats47/area` の `fetchPrefectures` / `REGIONS` / 座標関連export
- `@stats47/components` の Command / Popover / Select / Tabs等
- `apps/web/src/lib/analytics/events.ts` と関連test
- 既存のareas / area-profile test

採用する完成形は次のとおりです。

1. `/areas` を `Breadcrumbs` + `PageHeader` に統一し、h1を「都道府県から統計を見る」、説明を県ページの価値が伝わる文言へ変更する。
2. 都道府県名を直接入力できるアクセシブルな検索Comboboxを第一入口として追加する。東京/東京都のsuffix省略matching、keyboard操作、0件state、Enter遷移を実装する。
3. desktopは「SSR可能な軽量タイル地図 + 地方別ディレクトリ」の2ペインにする。
4. mobileは押しやすい一覧をdefaultにし、地図は「地図から探す」へ切り替えた場合だけ見せる。全linkのtargetを最低44pxにする。
5. 現行のD3 Client-only `AreaSelectorMap`を `/areas` から外し、CSS Gridまたはinline SVGのSSR link mapへ置き換える。初期HTMLに全47県linkが存在し、JS失敗時も遷移できるようにする。既存TileGridMap自体は他の統計可視化で使うため削除・変更しない。
6. 地方区分へ連続色 `interpolateSpectral` を使わず、light/dark対応のcategorical colorと地方名/legendを併用する。色だけで意味を伝えない。
7. map、list、searchはすべて `fetchPrefectures()` と `REGIONS` をSSOTとして使い、新しい県配列を複製しない。
8. map/list/searchのclickを既存 `nav_click` で計測し、`nav_surface` を `areas_map` / `areas_list` / `areas_search` として区別する。新イベントやcustom dimensionは原則増やさない。analytics失敗で遷移を止めない。
9. ItemList JSON-LD、canonical、県URLを維持する。
10. 不要になった旧AreaSelectorMapのcomponent/export/importは、全利用箇所を確認してから削除する。

47枚の大型カード、観光写真、AI画像、暗色hero、GPS、市区町村検索、人気順、最近見た県、2県比較、URL変更、広告slot変更は追加しないでください。ページ全体をClient Componentにしないでください。

pure unit、component、analytics、SSR/routeの対象testを追加・更新してください。最低限、47県一意性、URL、東京/東京都matching、keyboard選択、mobile default list、map/listのaccessible name、analytics source、初期HTMLの47 link、JSON-LDを検証してください。

検証は対象test、`npm run type-check --workspace apps/web`、`npm run design-system:check --workspace apps/web`、`git diff --check`を実行してください。localhostで390 / 768 / 1024 / 1280 / 1440px、light/dark、keyboard、Cookie banner表示時、console/hydration error 0を確認してください。route/SSR/bundleへの影響から必要ならweb full buildも実行し、省略時は理由を明記してください。

実装後、`docs/todo/02_機能バックログ.md#AREAS-DIRECTORY-UX-01` を実結果へ更新してください。本仕様書は恒久仕様なので削除しないでください。すべての成功条件を確認するまで「完了」と報告しないでください。本番deployは行わず、ローカル実装と検証が完了した時点で停止してください。
```

