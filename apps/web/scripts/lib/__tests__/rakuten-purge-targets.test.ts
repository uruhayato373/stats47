// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { isSnapshotContentChanged, resolveRakutenPurgePaths } from "../rakuten-purge-targets";

const snapshot = (generatedAt: string, price: number) => ({
  generatedAt,
  items: [{ name: "ホタテ", url: "https://hb.afl.rakuten.co.jp/x", price, image: "https://img/x.jpg" }],
});

describe("isSnapshotContentChanged", () => {
  it("generatedAt だけが変わった snapshot は変化なしとする (毎日全件を消さない)", () => {
    expect(isSnapshotContentChanged(snapshot("2026-09-23", 8500), snapshot("2026-09-24", 8500))).toBe(false);
  });

  it("表示する値が変わった snapshot と本番に無い snapshot は変化ありとする", () => {
    expect(isSnapshotContentChanged(snapshot("2026-09-23", 8500), snapshot("2026-09-24", 9000))).toBe(true);
    expect(isSnapshotContentChanged(null, snapshot("2026-09-24", 8500))).toBe(true);
  });
});

describe("resolveRakutenPurgePaths", () => {
  const blogs = [
    // 家計調査の記事は furusato vertical に解決され、楽天カードが出る
    { slug: "natto-kakei", published: true, tags: [], surveyIds: ["kakei-chousa"] },
    // 出典調査もタグも無い記事は vertical が決まらず、楽天カードが出ない
    { slug: "no-intent", published: true, tags: [], surveyIds: [] },
    { slug: "draft-kakei", published: false, tags: [], surveyIds: ["kakei-chousa"] },
  ];
  const kakeiRankingKeys = ["natto-consumption-expenditure"];

  it("何も変わっていなければ何も消さない", () => {
    expect(
      resolveRakutenPurgePaths({ change: { furusatoPrefCodes: [], itemTerms: [] }, kakeiRankingKeys, blogs }),
    ).toEqual([]);
  });

  it("品目だけが変わった日は、ランキングと楽天カードを出す記事だけを消し、県・市区町村ページは消さない", () => {
    const paths = resolveRakutenPurgePaths({
      change: { furusatoPrefCodes: [], itemTerms: ["納豆"] },
      kakeiRankingKeys,
      blogs,
    });
    expect(paths).toEqual(["/blog/natto-kakei", "/ranking/natto-consumption-expenditure"]);
  });

  it("返礼品が変わった県は、県ページとその県の市区町村ページだけを消す", () => {
    const paths = resolveRakutenPurgePaths({
      change: { furusatoPrefCodes: ["13000"], itemTerms: [] },
      kakeiRankingKeys,
      blogs,
    });
    expect(paths).toContain("/areas/13000");
    expect(paths).toContain("/areas/13000/cities/13201"); // 八王子市 (city ページは @stats47/area の CITIES が母集合)
    expect(paths.some((path) => path.startsWith("/areas/27000"))).toBe(false);
    expect(paths.filter((path) => path.startsWith("/areas/13000/cities/")).length).toBeGreaterThan(20);
  });
});

// purge 対象の写像は「楽天カードを描画する場所」を列挙した上に成り立つ。描画箇所が増えたのに
// 写像を直さないと、新しい箇所のカードが同期後も古いまま残る。増減したらここで止める。
describe("楽天カードの描画箇所", () => {
  const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const srcRoot = join(webRoot, "src");

  function listTsx(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === "__tests__" ? [] : listTsx(path);
      return entry.name.endsWith(".tsx") ? [path] : [];
    });
  }

  it("rakuten-purge-targets.ts が前提とする 5 ファイルだけに限られる", () => {
    const renderers = listTsx(srcRoot)
      .filter((file) => /<(RakutenItemsCard|FurusatoNozeiCard)\b/.test(readFileSync(file, "utf8")))
      .map((file) => relative(webRoot, file).split("\\").join("/"))
      .sort();
    expect(renderers).toEqual([
      "src/app/areas/[areaCode]/page.tsx",
      "src/app/blog/[slug]/page.tsx",
      "src/features/area-profile/components/CityPageFooter.tsx",
      "src/features/ranking/components/RankingKeyPage/RankingPageRakutenNativeSection.tsx",
      "src/features/ranking/components/RankingKeyPage/RankingPageSidebarSection.tsx",
    ]);
  });
});
