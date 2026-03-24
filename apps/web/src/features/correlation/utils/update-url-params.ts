/** 相関分析ページの URL パラメータ (x, y) を浅い遷移で更新する */
export function updateUrlParams(x: string, y: string): void {
  const url = new URL(window.location.href);
  if (x) url.searchParams.set("x", x);
  else url.searchParams.delete("x");
  if (y) url.searchParams.set("y", y);
  else url.searchParams.delete("y");
  window.history.replaceState(null, "", url.toString());
}
