/**
 * 公開後に置き換えられた旧 ranking slug の恒久転送先。
 *
 * X・外部記事に残る旧 URL を、同じ統計定義の現行ページへ一段で 301 する。
 * 転送先は KNOWN かつ非 GONE であることをテストで固定する。
 */
export const RANKING_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  // 旧KSJ漁港系列は終了し、水産庁の公式登録総数へ統合。旧年の系列は接続しない。
  'fishing-port-count': 'fishing-port-count-ksj',
  'ssdse-c-lb021101': 'tuna-consumption-expenditure',
  'ssdse-c-lb061001': 'apple-consumption-expenditure',
  'ssdse-c-lb092007': 'gyoza-frozen-consumption-expenditure',
  'ssdse-c-lb101001': 'green-tea-consumption-expenditure',
  'ssdse-c-lb121101': 'soba-udon-dining-consumption-expenditure',
  'ssdse-d-md22': 'hobby-participation-rate-diy',
  'per-capita-kenmin-shotoku-h27': 'per-capita-prefectural-income-h27',
};
