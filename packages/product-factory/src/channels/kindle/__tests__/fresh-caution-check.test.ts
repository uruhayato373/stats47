import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { BOOK_RANKING_KEYS } from "../book-ranking-keys";
import { checkFreshCautions, requiredCautionTerms, type CautionMetric } from "../fresh-caution-check";

const DIR = resolve(__dirname, "../manuscripts/K-S3-08");
const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((file) => ({ file, text: readFileSync(join(DIR, file), "utf8") }));
const metrics: CautionMetric[] = (BOOK_RANKING_KEYS["K-S3-08"] ?? []).map((key) => ({
  key,
  ...((METRICS_REGISTRY as Record<string, Omit<CautionMetric, "key"> | undefined>)[key] ?? {}),
}));

describe("書き下ろし原稿の注記と年の書き分け (KINDLE-FRESH-CAUTION-CHECK-01)", () => {
  it("今の K-S3-08 の原稿では error 0", () => {
    expect(checkFreshCautions(files, metrics)).toEqual([]);
  });

  it("[mutation] 県の章から注記「帰属家賃」を消すと caution-missing になる", () => {
    const broken = files.map((f) => (f.file === "25-oita.md" ? { ...f, text: f.text.split("帰属家賃").join("家賃") } : f));
    const found = checkFreshCautions(broken, metrics);
    expect(found.some((x) => x.file === "25-oita.md" && x.code === "caution-missing" && x.msg.includes("帰属家賃"))).toBe(
      true,
    );
  });

  it("[mutation] 年度の指標 (有効求人倍率) の「2022年度」を「2022年」に書き換えると year-format になる", () => {
    const target = files.find((f) => f.text.includes("有効求人倍率（2022年度）"));
    expect(target).toBeDefined();
    const broken = files.map((f) =>
      f.file === target!.file ? { ...f, text: f.text.replace("有効求人倍率（2022年度）", "有効求人倍率（2022年）") } : f,
    );
    const found = checkFreshCautions(broken, metrics);
    expect(found.some((x) => x.file === target!.file && x.code === "year-format")).toBe(true);
  });

  it("[mutation] 暦年の指標 (持ち家比率) に「年度」を付けると year-format になる", () => {
    const target = files.find((f) => f.text.includes("持ち家比率（2023年）"));
    expect(target).toBeDefined();
    const broken = files.map((f) =>
      f.file === target!.file ? { ...f, text: f.text.replace("持ち家比率（2023年）", "持ち家比率（2023年度）") } : f,
    );
    expect(checkFreshCautions(broken, metrics).some((x) => x.code === "year-format")).toBe(true);
  });

  it("はじめに・おわりには第1章 (読み方) の注記に頼ってよいが、第1章からも消すと error になる", () => {
    const noHowTo = files.map((f) =>
      f.file === "10-how-to-read.md" ? { ...f, text: f.text.split("帰属家賃").join("家賃") } : f,
    );
    const found = checkFreshCautions(noHowTo, metrics);
    expect(found.some((x) => x.file === "00-intro.md" && x.code === "caution-missing")).toBe(true);
  });

  it("要る語は定義の文から決まる: 「県庁所在市だけでなく」の物価指数には県庁所在市を要求しない", () => {
    expect(requiredCautionTerms({ key: "a", note: "家計調査の都道府県庁所在市の値で、県全体の値ではありません。" })).toEqual([
      { term: "県庁所在市", why: "県庁所在市の値で県全域の値ではない" },
    ]);
    expect(
      requiredCautionTerms({ key: "b", note: "県庁所在市だけでなく調査市町村の価格から作る。「持家の帰属家賃」は含まれません。" }).map(
        (t) => t.term,
      ),
    ).toEqual(["帰属家賃"]);
  });
});
