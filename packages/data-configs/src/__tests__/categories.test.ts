import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CATEGORIES, getCategoryDescription, getCategoryName, listCategories } from "../categories";
import { CATEGORY_KEYS as GENERATED_KEYS } from "../category-keys.generated";
import { listTopicCatalogs } from "../topics";
import { CATEGORY_KEYS } from "../types";

const DATA_DIR = resolve(__dirname, "../../../../data/categories");
const master = JSON.parse(readFileSync(resolve(DATA_DIR, "categories.json"), "utf8")) as {
  categories: Array<{ key: string; name: string; icon: string; description: string }>;
};

/** 表示順 (= 配列の順) とキー・表示名・アイコン。URL・指標・トピックが指すので、変えるときは意図して直す */
const EXPECTED_CATEGORIES: ReadonlyArray<readonly [string, string, string]> = [
  ["landweather", "国土・気象", "MapPin"],
  ["population", "人口・世帯", "Users"],
  ["laborwage", "労働・賃金", "TrendingUp"],
  ["agriculture", "農林水産業", "Sprout"],
  ["miningindustry", "鉱工業", "Factory"],
  ["commercial", "商業・サービス業", "Store"],
  ["economy", "企業・家計・経済", "PieChart"],
  ["construction", "住宅・土地・建設", "Home"],
  ["energy", "エネルギー・水", "Droplets"],
  ["tourism", "運輸・観光", "Plane"],
  ["educationsports", "教育・文化・スポーツ", "GraduationCap"],
  ["administrativefinancial", "行財政", "Building2"],
  ["safetyenvironment", "司法・安全・環境", "ShieldCheck"],
  ["socialsecurity", "社会保障・衛生", "Hospital"],
  ["international", "国際", "Globe"],
  ["infrastructure", "社会基盤施設", "Construction"],
  ["ict", "情報通信・科学技術", "Wifi"],
];

/** カテゴリごとのトピックのキー (表示順)。指標の割り当ては件数を凍結しないが、見出しの並びはここで固定する */
const EXPECTED_TOPIC_KEYS: Record<string, string[]> = {
  administrativefinancial: ["expenditure", "revenue", "fiscal-health", "public-servant", "election", "land-value"],
  agriculture: ["catch-by-species", "fishery", "farm-output", "farmland", "farm-worker", "livestock"],
  commercial: ["store-count", "sales", "establishment-size", "life-service", "employment"],
  construction: ["housing-type", "housing-size", "rent-land-price", "housing-equipment", "construction-industry"],
  economy: ["consumer-prices", "income", "savings", "household-budget", "regional-economy", "food-grain", "food-seafood", "food-meat", "food-dairy", "food-vegetable", "food-fruit", "food-seasoning", "food-sweets", "food-prepared", "food-beverage", "food-alcohol", "food-eating-out", "food-total", "housing", "utilities", "furniture", "clothing", "health", "transport", "education", "culture", "misc"],
  educationsports: ["activity-rate", "school-count", "student-count", "education-cost", "advancement", "child-welfare", "physique", "library-culture"],
  energy: ["power-generation", "consumption", "gas", "water-use"],
  ict: ["telecom", "device", "media-use"],
  infrastructure: ["water", "road", "port", "park", "dam"],
  international: ["foreign-residents"],
  laborwage: ["occupation-income", "living-time", "wage", "industry-structure", "job-opening", "work-style", "employment-rate", "commute", "disability-employment"],
  landweather: ["weather", "land-use", "nature-park", "area"],
  miningindustry: ["manufacturing", "industrial-land"],
  population: ["cause-of-death", "migration", "marital", "age-structure", "birth", "household", "foreign", "density"],
  safetyenvironment: ["traffic-accident", "crime", "disaster-fire", "waste", "pollution", "suicide"],
  socialsecurity: ["medical-staff", "medical-facility", "receiving-care", "welfare-disability", "welfare-elderly", "public-assistance", "insurance", "hygiene", "childcare"],
  tourism: ["travel-activity", "accommodation", "passenger", "freight", "vehicle"],
};

describe("カテゴリマスタ (data/categories/categories.json)", () => {
  it("CATEGORY_KEYS は JSON のキーと同じ集合・同じ順序で、生成した型の元と同一", () => {
    expect([...CATEGORY_KEYS]).toEqual(master.categories.map((c) => c.key));
    expect(CATEGORY_KEYS).toBe(GENERATED_KEYS);
    expect([...CATEGORY_KEYS]).toEqual(["landweather", "population", "laborwage", "agriculture", "miningindustry", "commercial", "economy", "construction", "energy", "tourism", "educationsports", "administrativefinancial", "safetyenvironment", "socialsecurity", "international", "infrastructure", "ict"]);
  });

  it("17 件のキー・表示名・アイコンが表示順に並ぶ", () => {
    expect(CATEGORIES.map((c) => [c.categoryKey, c.categoryName, c.icon])).toEqual(EXPECTED_CATEGORIES);
  });

  it("displayOrder は配列 index と一致し、キーも表示名も重複しない", () => {
    CATEGORIES.forEach((c, i) => expect(c.displayOrder).toBe(i));
    expect(new Set(CATEGORIES.map((c) => c.categoryKey)).size).toBe(CATEGORIES.length);
    expect(new Set(CATEGORIES.map((c) => c.categoryName)).size).toBe(CATEGORIES.length);
  });

  it("全件が SEO 概要を持ち、引く関数が JSON と同じ値を返す", () => {
    for (const c of master.categories) {
      expect(c.description.length).toBeGreaterThan(0);
      expect(getCategoryName(c.key)).toBe(c.name);
      expect(getCategoryDescription(c.key)).toBe(c.description);
    }
    expect(getCategoryName("unknown")).toBeNull();
    expect(listCategories()).toBe(CATEGORIES);
  });
});

describe("トピック (data/categories/topics/<categoryKey>.json)", () => {
  it("ファイルはカテゴリ 1 件に 1 つで、名前が categoryKey と一致する", () => {
    const files = readdirSync(resolve(DATA_DIR, "topics")).map((f) => f.replace(/.json$/, "")).sort();
    expect(files).toEqual([...CATEGORY_KEYS].sort());
    for (const catalog of listTopicCatalogs()) {
      expect(files).toContain(catalog.categoryKey);
    }
  });

  it("17 カテゴリ・113 トピックがカテゴリ順 (ファイル名順) に並び、見出しのキーと順序が固定されている", () => {
    const catalogs = listTopicCatalogs();
    expect(catalogs.map((c) => c.categoryKey)).toEqual(Object.keys(EXPECTED_TOPIC_KEYS));
    expect(Object.fromEntries(catalogs.map((c) => [c.categoryKey, c.topics.map((t) => t.key)]))).toEqual(EXPECTED_TOPIC_KEYS);
    expect(catalogs.reduce((n, c) => n + c.topics.length, 0)).toBe(113);
  });

  it("topic の形: label が空でなく、matcher は title (正規表現が有効) か kakei-cat01 (economy のみ)", () => {
    for (const catalog of listTopicCatalogs()) {
      for (const topic of catalog.topics) {
        expect(topic.label.length, `${catalog.categoryKey}/${topic.key}`).toBeGreaterThan(0);
        for (const matcher of topic.matchers) {
          if (matcher.kind === "title") expect(() => new RegExp(matcher.pattern)).not.toThrow();
          else {
            expect(catalog.categoryKey).toBe("economy");
            expect(matcher.prefixes.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("overrides の宛先はそのカテゴリの topic か other", () => {
    for (const catalog of listTopicCatalogs()) {
      const valid = new Set([...catalog.topics.map((t) => t.key), "other"]);
      for (const [metricKey, topicKey] of Object.entries(catalog.overrides ?? {})) {
        expect(valid.has(topicKey), `${catalog.categoryKey}: ${metricKey} → ${topicKey}`).toBe(true);
      }
    }
  });
});
