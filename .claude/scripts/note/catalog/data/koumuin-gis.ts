/**
 * note-catalog データ: koumuin-gis (2 件)
 *
 * ⚠️ このファイルが SSOT。手編集してよいのは editorial メタ (magazine / series /
 * stats47Targets / title) のみ。派生インデックス note-published-urls.json は
 * generate-note-catalog.ts で再生成する (手編集しない)。
 *
 * 初版は bootstrap-from-indices.mjs が既存インデックスから生成。
 */
import type { NoteArticle } from "../types";

export const koumuinGisArticles: NoteArticle[] = [
  {
    key: "koumuin-gis-01-depopulation-medical",
    vertical: "koumuin-gis",
    title: "自治体職員のためのGIS入門 — 無料の国土数値情報で「過疎地域×医療機関」を可視化する",
    magazine: "koumuin-gis",
    isPaid: false,
    status: "published",
    noteUrl: "https://note.com/stats47/n/n686dcc017bbe",
    publishedAt: "2026-06-06",
    r2Path: "note/koumuin-gis/koumuin-gis-01-depopulation-medical",
  },
  {
    key: "paid-nf80da34b28c3",
    vertical: "koumuin-gis",
    title: "【D3.js×Next.js】ダサい地図から脱却するデータ可視化の配色理論。AIへの的確な指示にも使える全98種コード付き",
    magazine: "product-d3-colors",
    isPaid: true,
    priceJpy: 200,
    status: "published",
    noteUrl: "https://note.com/stats47/n/nf80da34b28c3",
    publishedAt: "2025-12-16",
    r2Path: "note/koumuin-gis/nf80da34b28c3",
    r2Body: true,
  },
];
