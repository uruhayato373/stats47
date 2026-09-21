/**
 * GA4 `affiliate_vertical` に **広告自身の意図軸** を送ることを機械強制する契約テスト。
 *
 * 背景 (2026-09-20 実測): 2026-08-10〜09-06 の 28 日で affiliate の impression は 26,674、
 * click は 13 だった。どの意図軸が効いているかを調べようとしたところ、impression の約 29% が
 * `affiliate_vertical = other`、約 31% が `economy` に記録されていた。原因は在庫の偏りではなく
 * 計測の欠陥で、次の 3 つが同時に起きていた。
 *
 *   1. `AffiliateTextAdList` がページ文脈の prop (`affiliateCategory`) を渡し、広告自身の
 *      vertical を捨てていた。
 *   2. blog 本文の手動バナーが `category` を渡さず、`BannerAd` の既定値 `"other"` が流れていた。
 *   3. `RakutenItemsCard` が商品カードに `category="economy"` を固定し、意図軸 economy の
 *      分母を汚していた。
 *
 * この状態では vertical 別 CTR が信用できず、配置の意思決定ができない。文書に書くだけでは
 * 次に触る人が同じ形に戻すので、ここで落とす。
 *
 * 規約: `.claude/rules/affiliate-ads-standards.md`
 *   - GA4 の `affiliate_vertical` は広告自身の vertical を使う。ページ側 prop で代用しない。
 *   - 意図軸 10 vertical 以外のものを 10 軸のいずれかとして計測しない。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { AFFILIATE_VERTICALS } from "../constants/affiliate-category";

const COMPONENTS_DIR = resolve(import.meta.dirname, "../components");

/**
 * `category={<ページ文脈値> ?? "other"}` の形。広告自身の vertical を先頭に置かずに
 * ページ文脈値へ直接落とすと、広告の意図軸が計測から失われる。
 */
const PAGE_CONTEXT_FALLBACK =
  /category=\{\s*affiliateCategory\s*\?\?\s*["']other["']\s*\}/;

/** `category="labor"` のように 10 軸の値を直書きする形。 */
const HARDCODED_VERTICAL = new RegExp(
  `category=["'](${AFFILIATE_VERTICALS.join("|")})["']`,
);

/**
 * 意図軸を直書きしてよい固定枠の allowlist。枠そのものが 1 つの vertical 専用で、
 * 解決層を通らない（在庫を引き当てるのではなく、その vertical の導線として置かれている）。
 * 追加するときは「なぜその枠が単一 vertical 固定なのか」をここに書く。
 */
const HARDCODED_VERTICAL_ALLOWLIST: Record<string, string> = {
  // ふるさと納税カードは furusato 導線そのもの。他の vertical では描画されない。
  "FurusatoNozeiCard.tsx": "furusato 専用カード",
  // labor 固定の自社プロモ枠。ASP 在庫ではなく常設リンク。
  "SidebarPromoBanner.tsx": "labor 固定の常設プロモ枠",
};

function listTsx(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .sort();
}

/** コメント行を除いたコードだけを返す (規約の言及そのものは許す)。 */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

describe("affiliate の計測ラベルは広告自身の vertical を使う", () => {
  const files = listTsx(COMPONENTS_DIR);

  it("components ディレクトリを列挙できる", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s: ページ文脈値へ直接フォールバックしない", (file) => {
    const code = codeOnly(readFileSync(join(COMPONENTS_DIR, file), "utf8"));
    expect(
      PAGE_CONTEXT_FALLBACK.test(code),
      `${file}: category に広告自身の vertical を先に置くこと ` +
        `(例: category={ad.vertical ?? affiliateCategory ?? "other"})`,
    ).toBe(false);
  });

  it.each(files)("%s: 意図軸を直書きしない", (file) => {
    const code = codeOnly(readFileSync(join(COMPONENTS_DIR, file), "utf8"));
    if (HARDCODED_VERTICAL_ALLOWLIST[file]) return;
    expect(
      HARDCODED_VERTICAL.test(code),
      `${file}: 10 軸の値を直書きすると意図軸別 CTR の分母が壊れる。` +
        `解決層の vertical を渡すか、10 軸外の専用ラベルを使う`,
    ).toBe(false);
  });

  it("allowlist は実在するファイルだけを挙げる", () => {
    for (const file of Object.keys(HARDCODED_VERTICAL_ALLOWLIST)) {
      expect(files, `${file} は components に無い`).toContain(file);
    }
  });
});
