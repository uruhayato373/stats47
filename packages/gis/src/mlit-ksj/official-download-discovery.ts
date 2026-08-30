export type KsjArchiveFormat = 'geojson' | 'shp' | 'gml';

export type KsjOfficialArchive = {
  dataId: string;
  version: string;
  filename: string;
  url: string;
  sizeBytes: number;
  format: KsjArchiveFormat;
  datum: 'jgd' | 'tokyo';
  scope: string;
  scopeLabel: string;
};

const NATIONAL_ARCHIVE_LIMIT = 256 * 1024 * 1024;

function parseSize(value: string): number {
  const match = value.trim().match(/^([0-9.]+)\s*(KB|MB|GB)$/i);
  if (!match) return 0;
  const unit = match[2].toUpperCase();
  const multiplier = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : 1024;
  return Math.round(Number(match[1]) * multiplier);
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function versionRank(version: string): number {
  const digits = version.replace(/\D/g, '');
  if (!digits) return 0;
  const value = Number(digits);
  if (digits.length === 2) return value <= 40 ? 2000 + value : 1900 + value;
  return value;
}

function archiveScope(filename: string, format: KsjArchiveFormat): string {
  const stem = filename.replace(/_(?:GEOJSON|SHP|GML)\.zip$/i, '');
  const withoutVersion = stem.replace(/^[A-Za-z0-9-]+-[0-9]+_?/, '');
  if (withoutVersion && withoutVersion !== stem) {
    const fullScope = withoutVersion
      .replace(/[^A-Za-z0-9._~-]+/g, '-')
      .replace(/^-|-$/g, '');
    if (fullScope) return fullScope;
  }
  const twoDigit = stem.match(/_([0-9]{2})$/)?.[1];
  if (twoDigit) return twoDigit;
  const municipal = stem.match(/_([0-9]{5})$/)?.[1];
  if (municipal) return municipal;
  const scope = withoutVersion.replace(/[^A-Za-z0-9._~-]+/g, '-').replace(/^-|-$/g, '');
  return scope || (format === 'geojson' ? 'national' : 'national');
}

function rawHtmlArchives(
  dataId: string,
  sourcePageUrl: string,
  html: string
): KsjOfficialArchive[] {
  const archives: KsjOfficialArchive[] = [];
  const pattern = /DownLd\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+\.zip)['"]\s*,\s*['"]([^'"]+\.zip)['"]/g;
  for (const match of html.matchAll(pattern)) {
    const filename = match[2];
    const format: KsjArchiveFormat | null = /GEOJSON\.zip$/i.test(filename)
      ? 'geojson'
      : /SHP\.zip$/i.test(filename)
        ? 'shp'
      : /GML\.zip$/i.test(filename)
        ? 'gml'
        : null;
    if (!format || match.index === undefined) continue;
    const rowStart = html.lastIndexOf('<tr', match.index);
    const rowEnd = html.indexOf('</tr>', match.index);
    const scopeLabel = decodeHtmlText(
      rowStart >= 0 && rowEnd >= 0 ? html.slice(rowStart, rowEnd + 5) : ''
    );
    const datum = /日本測地系|Tokyo Datum/i.test(scopeLabel) ? 'tokyo' : 'jgd';
    const url = new URL(match[3].replace(/\/+/g, '/'), sourcePageUrl).toString();
    const escapedId = dataId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const version = url.match(new RegExp(`/data/${escapedId}/${escapedId}-([^/]+)/`, 'i'))?.[1];
    if (!version) continue;
    archives.push({
      dataId,
      version,
      filename,
      url,
      sizeBytes: parseSize(match[1]),
      format,
      datum,
      scope: archiveScope(filename, format),
      scopeLabel,
    });
  }
  return archives;
}

function selectLatestArchives(archives: KsjOfficialArchive[]): KsjOfficialArchive[] {
  if (archives.length === 0) return [];
  const latestVersion = [...new Set(archives.map((archive) => archive.version))]
    .sort((a, b) => versionRank(b) - versionRank(a) || b.localeCompare(a))[0];
  const latest = archives.filter((archive) => archive.version === latestVersion);
  const datum: KsjOfficialArchive['datum'] = latest.some((archive) => archive.datum === 'jgd')
    ? 'jgd'
    : 'tokyo';
  const selectedDatum = latest.filter((archive) => archive.datum === datum);
  const preferredFormat: KsjArchiveFormat =
    (['geojson', 'shp', 'gml'] as const).find((format) =>
      selectedDatum.some((archive) => archive.format === format)
    ) ?? 'gml';
  const preferred = selectedDatum.filter((archive) => archive.format === preferredFormat);
  const national = preferred.filter(
    (archive) => archive.scopeLabel.includes('全国') || archive.scope === 'national'
  );
  if (national.length > 0 && national.every((archive) => archive.sizeBytes <= NATIONAL_ARCHIVE_LIMIT)) {
    return national;
  }

  const prefecturePartitions = preferred.filter((archive) => {
    const code = Number(archive.scope);
    return /^\d{2}$/.test(archive.scope) && code >= 1 && code <= 47;
  });
  const selected = prefecturePartitions.length >= 40
    ? prefecturePartitions
    : preferred.filter((archive) => !national.includes(archive));
  return [...new Map(selected.map((archive) => [archive.url, archive])).values()].sort((a, b) =>
    a.scope.localeCompare(b.scope) || a.url.localeCompare(b.url)
  );
}

function parseA55(source: string): KsjOfficialArchive[] {
  const arrayText = source.match(/const\s+tokei_data2024\s*=\s*(\[[\s\S]*\]);?\s*$/)?.[1];
  if (!arrayText) throw new Error('A55公式manifestを解析できません');
  const rows = JSON.parse(arrayText) as Array<{
    city: string;
    citycode: string;
    data: string;
    file: string;
    dl: string;
    filecapacity: string;
    CS: string;
  }>;
  return rows
    .filter(
      (row) =>
        row.data.includes('GEOJSON') &&
        row.CS === '世界測地系' &&
        /^\d{2}000$/.test(row.citycode)
    )
    .map((row) => ({
      dataId: 'A55',
      version: '24',
      filename: row.file,
      url: new URL(row.dl, 'https://nlftp.mlit.go.jp').toString(),
      sizeBytes: parseSize(row.filecapacity),
      format: 'geojson' as const,
      datum: 'jgd' as const,
      scope: row.citycode.slice(0, 2),
      scopeLabel: row.city,
    }))
    .sort((a, b) => a.scope.localeCompare(b.scope));
}

export function parseOfficialKsjArchives(options: {
  dataId: string;
  sourcePageUrl: string;
  pageSource: string;
}): KsjOfficialArchive[] {
  const raw = options.dataId === 'A55'
    ? parseA55(options.pageSource)
    : rawHtmlArchives(options.dataId, options.sourcePageUrl, options.pageSource);
  return options.dataId === 'A55' ? raw : selectLatestArchives(raw);
}

export async function discoverOfficialKsjArchives(options: {
  dataId: string;
  sourcePageUrl: string;
}): Promise<KsjOfficialArchive[]> {
  const manifestUrl = options.dataId === 'A55'
    ? 'https://nlftp.mlit.go.jp/ksj/js/tokei_data2024.js'
    : options.sourcePageUrl;
  const response = await fetch(manifestUrl, {
    headers: { 'User-Agent': 'stats47-gis-catalog/1.0' },
  });
  if (!response.ok) {
    throw new Error(`公式配布manifestの取得に失敗しました: ${response.status} ${manifestUrl}`);
  }
  const archives = parseOfficialKsjArchives({
    ...options,
    pageSource: await response.text(),
  });
  if (archives.length === 0) {
    throw new Error(`公式配布archiveを解決できません: ${options.dataId}`);
  }
  return archives;
}

/** 同一版・同一scopeの公式代替配布（主に壊れたGeoJSONに対するSHP）を解決する。 */
export async function discoverOfficialKsjArchiveAlternatives(options: {
  dataId: string;
  sourcePageUrl: string;
  archive: KsjOfficialArchive;
}): Promise<KsjOfficialArchive[]> {
  if (options.dataId === 'A55') return [];
  const response = await fetch(options.sourcePageUrl, {
    headers: { 'User-Agent': 'stats47-gis-catalog/1.0' },
  });
  if (!response.ok) {
    throw new Error(
      `公式配布manifestの取得に失敗しました: ${response.status} ${options.sourcePageUrl}`
    );
  }
  return rawHtmlArchives(options.dataId, options.sourcePageUrl, await response.text())
    .filter((candidate) =>
      candidate.version === options.archive.version &&
      candidate.scope === options.archive.scope &&
      candidate.datum === options.archive.datum &&
      candidate.url !== options.archive.url
    )
    .sort((a, b) => {
      const rank = (format: KsjArchiveFormat): number =>
        format === 'shp' ? 0 : format === 'geojson' ? 1 : 2;
      return rank(a.format) - rank(b.format) || a.url.localeCompare(b.url);
    });
}
