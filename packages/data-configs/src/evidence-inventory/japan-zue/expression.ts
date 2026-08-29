export type JapanZueExpressionMatch = {
  sourcePath: string;
  publicPath: string;
  fingerprint: string;
};

const DEFAULT_NGRAM_SIZE = 30;
const DEFAULT_ALLOWLIST = [
  "総務省統計局",
  "政府統計の総合窓口",
  "都道府県",
  "日本国勢図会",
];

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function fingerprints(value: string, ngramSize: number): Set<string> {
  const normalized = normalize(value);
  const result = new Set<string>();
  for (let index = 0; index + ngramSize <= normalized.length; index += 1) {
    result.add(normalized.slice(index, index + ngramSize));
  }
  return result;
}

export function auditJapanZueExpressionSimilarity(
  sources: Readonly<Record<string, string>>,
  publicFiles: Readonly<Record<string, string>>,
  options: { ngramSize?: number; allowlist?: readonly string[] } = {},
): JapanZueExpressionMatch[] {
  const ngramSize = options.ngramSize ?? DEFAULT_NGRAM_SIZE;
  const allowlist = new Set((options.allowlist ?? DEFAULT_ALLOWLIST).map(normalize));
  const sourceOwners = new Map<string, string>();
  for (const [sourcePath, content] of Object.entries(sources)) {
    for (const fingerprint of fingerprints(content, ngramSize)) {
      if ([...allowlist].some((allowed) => allowed.length > 0 && fingerprint.includes(allowed))) continue;
      if (!sourceOwners.has(fingerprint)) sourceOwners.set(fingerprint, sourcePath);
    }
  }

  const matches: JapanZueExpressionMatch[] = [];
  const seen = new Set<string>();
  for (const [publicPath, content] of Object.entries(publicFiles)) {
    for (const fingerprint of fingerprints(content, ngramSize)) {
      const sourcePath = sourceOwners.get(fingerprint);
      if (!sourcePath) continue;
      const key = `${sourcePath}:${publicPath}:${fingerprint}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({ sourcePath, publicPath, fingerprint });
      if (matches.length >= 200) return matches;
    }
  }
  return matches;
}

export function findJapanZueRuntimeSourceReferences(
  publicFiles: Readonly<Record<string, string>>,
): Array<{ path: string; pattern: string }> {
  const forbidden: Array<{ pattern: string; expression: RegExp }> = [
    { pattern: "books/日本国勢図絵", expression: /books[\\/]日本国勢図絵/ },
    { pattern: "日本国勢図絵/figures", expression: /日本国勢図絵[\\/]figures/ },
    { pattern: "japan-zue/figures", expression: /japan-zue[\\/]figures/ },
    { pattern: "日本国勢図絵/ocr-raw", expression: /日本国勢図絵[\\/]ocr-raw/ },
    { pattern: "japan-zue/ocr-raw", expression: /japan-zue[\\/]ocr-raw/ },
    { pattern: "日本国勢図絵/transcripts", expression: /日本国勢図絵[\\/]transcripts/ },
    { pattern: "japan-zue/transcripts", expression: /japan-zue[\\/]transcripts/ },
  ];
  return Object.entries(publicFiles).flatMap(([path, content]) => {
    const match = forbidden.find(({ expression }) => expression.test(content));
    return match ? [{ path, pattern: match.pattern }] : [];
  });
}
