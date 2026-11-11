/**
 * 広告インテント (AdSense の自動広告の一種) を出してよいページの範囲。
 *
 * 既定は全ページで拒否する: `app/layout.tsx` と `app/global-error.tsx` の body に Google 公式の
 * `google-anno-skip` を常設している (2026-08 に、本文と出典の語が広告リンクへ書き換えられたため)。
 * body に付けると、広告インテントの 3 つの形 (既存の文字へのリンク・アンカー・チップ) がすべて止まる
 * (support.google.com/adsense/answer/13844047・2026-11-11 取得)。
 *
 * 2026-11-11 オーナー決定: 既存の文字を書き換えない形 (アンカー・チップ) だけを、まずブログの個別記事で試す。
 * 管理画面では「リンクを既存のテキストに挿入」をオフにした (同日オーナーが操作・読み取りで確認)。
 * サーバーが返す HTML の body には目印を残し、対象のページを開いたときだけ `AdIntentScope` が外す。
 * 外す処理が動かなければ拒否のままになる。出典・図の注記・表・引用・右レールには要素単位で目印を付け、
 * 管理画面の設定が変わっても、そこは書き換えられないようにする。
 *
 * 経過と判定: backlog `ADSENSE-OVERLAY-AB-01`。
 */

/** Google 公式の、広告インテントを拒否する class */
export const AD_INTENT_SKIP_CLASS = "google-anno-skip";

/** ブログの個別記事 `/blog/<slug>`。一覧 `/blog` とタグ `/blog/tags`・`/blog/tags/<tag>` は含めない */
const AD_INTENT_ALLOWED_PATH = /^\/blog\/(?!tags(?:\/|$))[^/]+\/?$/;

/** 広告インテント (アンカー・チップ) を出してよいページか */
export function isAdIntentAllowedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AD_INTENT_ALLOWED_PATH.test(pathname);
}
