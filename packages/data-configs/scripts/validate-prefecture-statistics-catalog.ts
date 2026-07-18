import {
  PREFECTURE_STATISTICS_CATALOG,
  PREFECTURE_STATISTICS_RESOURCE_TYPES,
  PREFECTURE_STATISTICS_TOPIC_KEYS,
} from "../src/prefecture-statistics-catalog";

const EXPECTED_PREFECTURE_COUNT = 47;
const OFFICIAL_DOMAIN_PATTERN =
  /(?:^|\.)(?:pref\.[a-z-]+(?:\.lg)?\.jp|metro\.tokyo\.lg\.jp|pref\.shimane-toukei\.jp)$/;

const errors: string[] = [];
const codes = new Set<string>();
const resourceIds = new Set<string>();

if (PREFECTURE_STATISTICS_CATALOG.length !== EXPECTED_PREFECTURE_COUNT) {
  errors.push(
    `都道府県数が ${EXPECTED_PREFECTURE_COUNT} 件ではありません: ${PREFECTURE_STATISTICS_CATALOG.length}`,
  );
}

for (const entry of PREFECTURE_STATISTICS_CATALOG) {
  if (codes.has(entry.prefectureCode)) {
    errors.push(`都道府県コードが重複しています: ${entry.prefectureCode}`);
  }
  codes.add(entry.prefectureCode);

  if (entry.resources.length === 0) {
    errors.push(`${entry.prefectureName} にリンクがありません`);
  }

  for (const resource of entry.resources) {
    if (resourceIds.has(resource.id)) {
      errors.push(`resource id が重複しています: ${resource.id}`);
    }
    resourceIds.add(resource.id);

    let url: URL;
    try {
      url = new URL(resource.url);
    } catch {
      errors.push(`${resource.id} のURLが不正です: ${resource.url}`);
      continue;
    }

    if (url.protocol !== "https:") {
      errors.push(`${resource.id} はHTTPSではありません: ${resource.url}`);
    }
    if (!OFFICIAL_DOMAIN_PATTERN.test(url.hostname)) {
      errors.push(`${resource.id} は都道府県公式ドメインではありません: ${url.hostname}`);
    }
    if (!PREFECTURE_STATISTICS_RESOURCE_TYPES.includes(resource.type)) {
      errors.push(`${resource.id} のtypeが不正です: ${resource.type}`);
    }
    for (const topic of resource.topics) {
      if (!PREFECTURE_STATISTICS_TOPIC_KEYS.includes(topic)) {
        errors.push(`${resource.id} のtopicが不正です: ${topic}`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resource.lastVerifiedAt)) {
      errors.push(`${resource.id} のlastVerifiedAtが不正です`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `prefecture statistics catalog: ${PREFECTURE_STATISTICS_CATALOG.length} prefectures / ${resourceIds.size} resources`,
  );
}
