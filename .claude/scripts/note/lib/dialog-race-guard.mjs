/**
 * Playwright が開いたブラウザを、別の CDP クライアント (browser-use) が同時に操作するときの保護。
 *
 * ページが alert / confirm / beforeunload を出すと、"dialog" の listener を持たない Playwright は自分で
 * ダイアログを閉じに行く (playwright-core 1.62.1 の DialogManager.dialogDidOpen は `dialog._close().then(() => {})`
 * で、失敗を受ける catch を持たない)。browser-use が先に閉じていると、Playwright の
 * `Page.handleJavaScriptDialog` は「No dialog is showing」で失敗し、未処理の rejection として
 * 起動スクリプトの Node を終了させる。Node が終わると、Playwright が開いたブラウザも閉じる
 * (2026-11-05 の note 公開で 1 回起きた。NOTE-PLAYWRIGHT-DIALOG-CRASH-01)。
 *
 * ダイアログは既に閉じているので、この 1 種類だけを無視してよい。ほかの未処理の rejection は
 * これまでどおりプロセスを落とす (握りつぶすと、壊れたセッションのまま公開の操作が続く)。
 */

/** browser-use が先に閉じたダイアログを Playwright が閉じようとして失敗したエラーか。 */
export function isDialogRaceError(reason) {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return message.includes("Page.handleJavaScriptDialog") && message.includes("No dialog is showing");
}

/**
 * ブラウザを起動する前に呼ぶ。戻り値の関数で解除できる。
 * handler の中で投げ直した例外は uncaughtException になり、Node は非 0 で終了する。
 */
export function installDialogRaceGuard({ proc = process, log = console.warn } = {}) {
  const handler = (reason) => {
    if (!isDialogRaceError(reason)) throw reason;
    log("[note-cdp] ダイアログを別の CDP クライアントが先に閉じた (Page.handleJavaScriptDialog: No dialog is showing)。無視して続ける");
  };
  proc.on("unhandledRejection", handler);
  return () => proc.off("unhandledRejection", handler);
}
