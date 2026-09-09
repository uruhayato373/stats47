/** 通常の商品URLを成果リンクとして計測しない。API発行のURLは改変しない。 */
export function isRakutenAffiliateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "hb.afl.rakuten.co.jp"
      && !url.username && !url.password;
  } catch {
    return false;
  }
}
