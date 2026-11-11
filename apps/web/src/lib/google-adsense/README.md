# Google AdSense統合ライブラリ

Google AdSense広告を表示するための技術ユーティリティ。設定は apps/web 内に集約し、packages には置かない。

> **現在の運用状態（2026-08-16）**: `constants.ts` の
> `ADSENSE_DISPLAY_ENABLED` を `false` に固定し、スクリプト、Auto ads、手動枠、
> AdSense fallback、広告用の空カード・予約高を全ページで停止中。環境変数が `true` でも表示しない。
> 再開判断後はこのスイッチだけを変更し、環境変数による本番制御へ戻す。

## 広告インテントの恒久オプトアウト

AdSense の「広告インテント」には 3 つの形がある。既存の本文を広告リンクへ置換する「リンク」は使わない
(2026-08 に本文と出典の語が書き換えられた)。文字を書き換えない「アンカー」「チップ」は、ブログの個別記事でだけ試す
(2026-11-11 オーナー決定。経過は backlog `ADSENSE-OVERLAY-AB-01`)。

- AdSense 管理画面の `広告 > stats47.jp > 編集 > インテント重視のフォーマット` で
  **「広告インテントのリンクをページの既存のテキストに挿入できるようにする」をオフ**に保つ
  (管理画面の操作は人間のみ。`.claude/scripts/google-admin/README.md`)。
- `app/layout.tsx` と `app/global-error.tsx` の `<body>` に Google 公式の
  `google-anno-skip` を付け、既定では全ページでリンク・アンカー・チップを挿入させない。
- ブログの個別記事 (`/blog/<slug>`) を開いたときだけ、`AdIntentScope` が body の目印を外す
  (範囲は `ad-intent-scope.ts` の `isAdIntentAllowedPath`)。サーバーが返す HTML には目印が残るので、
  外す処理が動かなければ拒否のままになる。
- 出典の一覧・図の注記 (`ChartFooter`)・表・引用・記事の見出し・右レールには要素単位で `google-anno-skip` を付け、
  管理画面の設定が変わっても書き換えられないようにする。
- `tests/smoke/third-party-dom-injection.spec.ts`・
  `src/lib/google-adsense/__tests__/ad-intents-opt-out-contract.test.ts`・
  `src/lib/google-adsense/__tests__/ad-intent-scope.test.tsx` がこの契約を固定する。

公式仕様: https://support.google.com/adsense/answer/13844047

## 概要

このライブラリは以下の機能を提供します：

- **AdSenseScript**: AdSense広告スクリプトの読み込み
- **AdSenseAd**: 広告の表示コンポーネント
- **AdSensePlaceholder**: 開発環境用プレースホルダー
- **constants**: 配置別スロット定数（slotId・format の一元管理）

## ディレクトリ構成

```
lib/google-adsense/
├── index.ts           # 再エクスポート
├── types.ts           # AdFormat, AdSlotProps, AD_SIZES
├── constants.ts       # 配置別スロット定数
├── components/        # AdSenseScript, AdSenseAd, AdSensePlaceholder
└── README.md
```

## 使用方法

### 1. スクリプトの読み込み

`app/layout.tsx` で AdSense スクリプトを読み込みます：

```tsx
import { AdSenseScript } from "@/lib/google-adsense";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* 広告を出さないページの接頭辞は GIS 台帳の利用条件から導く (ad-free-paths.ts) */}
        <AdSenseScript adFreePathPrefixes={AD_FREE_PATH_PREFIXES} />
        {children}
      </body>
    </html>
  );
}
```

### 2. 広告の表示（定数を使用）

配置別の定数を使うと、スロットIDの変更が一箇所で済みます：

```tsx
import { AdSenseAd, RANKING_PAGE_TABLE_SIDE } from "@/lib/google-adsense";

export default function Page() {
  return (
    <div>
      <AdSenseAd
        format={RANKING_PAGE_TABLE_SIDE.format}
        slotId={RANKING_PAGE_TABLE_SIDE.slotId}
      />
    </div>
  );
}
```

### 3. 広告の表示（直接指定）

定数を使わず、format と slotId を直接指定することもできます：

```tsx
import { AdSenseAd } from "@/lib/google-adsense";

<AdSenseAd format="rectangle" slotId="1234567890" />
```

## 配置別定数（constants.ts）

| 定数 | 用途 |
|------|------|
| `RANKING_PAGE_TABLE_SIDE` | ランキングページ: データテーブル横（PC）/ テーブル下（モバイル） |
| `RANKING_PAGE_FOOTER` | ランキングページ: メインコンテンツ最下部 |

新しい配置を追加する場合は `constants.ts` に `AdSlotConfig` を追加し、コンポーネントから参照する。同一ページで複数広告を出す場合は、AdSense ポリシーに従い配置ごとに別スロットの利用を推奨。

## 環境変数

AdSense再開時は以下の環境変数が必要です：

```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED=true
```

パブリッシャー ID (`ca-pub-…`) は公開値なので環境変数にせず、サイト識別子の正本 `packages/types/src/site.json` の `adsenseClientId` に置く (コードは `SITE.adsenseClientId`)。`apps/web/public/ads.txt` の `pub-…` と一致することをテストが確認する。

## 広告フォーマット

- `rectangle`: レスポンシブレクタングル（336x280 → 300x250）
- `banner`: レスポンシブバナー（728x90 → 320x50）
- `skyscraper`: スカイスクレイパー（160x600）
- `infeed`: インフィード広告
- `article`: 記事内広告

## 注意事項

- 全体スイッチが `false` の間は、開発用プレースホルダーを含めて何も描画しない
- `<body>` と要素単位の `google-anno-skip` は外さない（出典・本文の改変防止）。範囲を広げるときは `ad-intent-scope.ts` だけを変える
- 開発環境（`NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED=false`）ではプレースホルダーを表示
- 遅延ロード（Intersection Observer）により、パフォーマンスへの影響を最小化
- AdBlock で広告がブロックされた場合は何も表示しない
