---
name: GA4 設定状況
description: Google Analytics 4 の設定内容（Measurement ID、カスタムイベント、管理画面設定）
type: project
---

GA4 Measurement ID: G-SEK87WZJXE（.env.local の NEXT_PUBLIC_GA_MEASUREMENT_ID）

## カスタムイベント一覧（apps/web/src/lib/analytics/events.ts）
- `ranking_view` — ランキングページ閲覧（ranking_key, category_key, area_type, year_code）
- `year_change` — 年度切替（from_year, to_year）
- `area_type_change` — 都道府県/市区町村切替
- `search` — サイト内検索（search_term, results_count）
- `share` — シェアボタンクリック（method）
- `file_download` — CSV/JSONダウンロード
- `affiliate_click` — アフィリエイトクリック
- `ad_impression` — 広告表示（IntersectionObserver）
- `page_not_found` — 404エラー（page_path, page_referrer）

## Cookie 同意バナー
- GA4 Consent Mode 連携済み（デフォルト denied）
- localStorage キー: `stats47_cookie_consent`
- コンポーネント: `CookieConsentBanner.tsx`

## GA4 管理画面設定（2026-03-25 実施）
- データ保持期間: 14か月に変更済み

**Why:** 前年同月比の分析に14か月保持が必要。デフォルト2か月では不十分。

**How to apply:** GA4関連の変更時は events.ts のイベント一覧を参照。カスタムディメンション（ranking_key 等）はGA4管理画面でも登録が必要。
