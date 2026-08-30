function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract unique four-digit first-mesh codes for one exact dataset version. */
export function extractMeshCodesFromHtml(
  html: string,
  dataId: string,
  version: string,
): string[] {
  const filePattern = new RegExp(
    `${escapeRegExp(dataId)}-${escapeRegExp(version)}_([0-9]{4})[^"'\\s]*\\.zip`,
    "g",
  );
  const codes = new Set<string>();
  for (const match of html.matchAll(filePattern)) codes.add(match[1]);
  return [...codes].sort();
}

export async function discoverMeshCodes(input: {
  dataId: string;
  version: string;
  sourcePageUrl: string;
}): Promise<string[]> {
  const response = await fetch(input.sourcePageUrl, {
    headers: { "User-Agent": "stats47-gis-pipeline/1.0" },
  });
  if (!response.ok) {
    throw new Error(`公式配布ページ取得失敗: ${response.status} ${input.sourcePageUrl}`);
  }
  const codes = extractMeshCodesFromHtml(
    await response.text(),
    input.dataId,
    input.version,
  );
  if (codes.length === 0) {
    throw new Error(
      `${input.dataId} v${input.version} の1次メッシュ配布ファイルを公式ページから検出できませんでした。`,
    );
  }
  return codes;
}
