# 地域プロファイル（web）

## 概要

admin 側のバッチ処理で事前計算されたデータに基づき、特定の都道府県の統計的な特徴（強み・弱み）を表示するドメインです。

## 主要な責務

- **データ取得**: `area_profile_rankings` テーブルから特定の地域コードに紐づくデータを取得。
- **ビジュアライゼーション**: 全国平均や順位、パーセンタイルに基づいた統計情報の提示。
- **ナビゲーション**: 地域プロファイルからランキング詳細や地域間比較への導線を提供。

## ディレクトリ構成

- `actions/`: `getAreaProfile` (DB からのデータ読み取り)。
- `components/`: 
    - `AreaProfilePageClient`: メインレイアウト。
    - `StrengthsSection`: 上位項目の表示。
    - `WeaknessesSection`: 下位項目の表示。
- `types/`: web 側で扱う表示用データ構造の定義。

## 連携

- **地域間比較**: 現在表示中の地域をベースに、他の地域と比較するための導線を搭載しています（[region-comparison](../region-comparison/README.md)）。
- **ランキング**: 各指標のタイトルから、全国ランキング詳細ページへ遷移できます。

## 参照

- [地域プロファイル (admin)](../../../admin/src/features/area-profile/README.md): データの事前解析・バッチ処理。

## 開発時の注意

- SSR (Server Side Rendering) を基本とし、ページコンポーネントでデータをフェッチしてクライアントコンポーネントに渡す Composition Pattern を採用しています。
