/** R2 観測値の areaCode を buzz-map spec の data.values キーへ変換する (都道府県=2桁 / 市区町村=N03_007 5桁)。 */
export function toBuzzMapAreaCode(areaCode: string, level: "muni" | "pref"): string {
  return level === "pref" ? areaCode.slice(0, 2) : areaCode;
}
