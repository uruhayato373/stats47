import { lookupArea } from '@stats47/area';
import { CULTURAL_HERITAGE_SOURCE as definition } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const text = z
  .string()
  .min(1)
  .max(1000)
  .refine((value) => !/[<>]/.test(value), '事実の文字情報のみ');
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const kind = z.enum(['special-historic', 'special-scenic', 'special-natural']);
const record = z
  .object({
    id: z.string().regex(/^\d{1,8}$/),
    name: text,
    kinds: z.array(kind).min(1).max(3),
    rawPrefecture: text,
    location: text.nullable(),
    geography: z.enum(['prefecture', 'multi-prefecture', 'unspecified']),
    prefectureCodes: z
      .array(z.string().regex(/^(0[1-9]|[1-3][0-9]|4[0-7])000$/))
      .max(47),
    officialUrl: z.string().url(),
    evidence: z
      .array(
        z
          .object({
            url: z.string().url(),
            sha256: sha,
            retrievedAt: z.string().datetime({ offset: true }),
            basis: text,
            pdfPage: z.number().int().positive().optional(),
          })
          .strict()
      )
      .min(1)
      .max(2),
  })
  .strict()
  .superRefine((row, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const expected = (
      definition.recordPrefectures as Readonly<
        Record<string, readonly string[]>
      >
    )[row.id];
    if (!expected) {
      issue('確認済みの原典IDのみ');
      return;
    }
    if (JSON.stringify(row.prefectureCodes) !== JSON.stringify(expected))
      issue('公式に確認した県帰属を保持する');
    const geography =
      expected.length === 0
        ? 'unspecified'
        : expected.length === 1
          ? 'prefecture'
          : 'multi-prefecture';
    if (row.geography !== geography) issue('複数県と地域無指定を区別する');
    const region =
      geography === 'unspecified'
        ? '地域を定めない'
        : geography === 'multi-prefecture'
          ? '２県以上'
          : lookupArea(expected[0])?.areaName;
    if (row.rawPrefecture !== region) issue('原典の所在地地域欄を保持する');
    const expectedKinds = definition.categories
      .filter((category) =>
        (category.recordIds as readonly string[]).includes(row.id)
      )
      .map((category) => category.key);
    if (JSON.stringify(row.kinds) !== JSON.stringify(expectedKinds))
      issue('原典の3検索集合と種類を一致させる');
    if (
      (row.location === null) !==
      (definition.missingLocationIds as readonly string[]).includes(row.id)
    )
      issue('未記載の所在地を固定する');
    const basis =
      '名称・種別1/2・所在都道府県・所在地（市区町村）欄を照合。' +
      (row.id === '3081'
        ? '同ページの青森・秋田両県にまたがる説明の事実から県帰属を確認。'
        : '');
    if (
      row.evidence[0]?.basis !== basis ||
      row.evidence[0]?.pdfPage !== undefined
    )
      issue('根拠本文の複製を許可しない');
    const extra = (
      definition.geographyEvidence as Readonly<
        Record<
          string,
          { url: string; basis: string; pdfPage?: number; sha256?: string }
        >
      >
    )[row.id];
    const supplement = extra && extra.url !== row.officialUrl ? extra : null;
    if (row.evidence.length !== (supplement ? 2 : 1))
      issue('根拠資料の数を保持する');
    if (
      supplement &&
      (row.evidence[1]?.url !== supplement.url ||
        row.evidence[1]?.basis !== supplement.basis ||
        row.evidence[1]?.pdfPage !== supplement.pdfPage ||
        row.evidence[1]?.sha256 !== supplement.sha256)
    )
      issue('補完県の一次資料と具体的根拠を保持する');
    if (
      row.officialUrl !== `${definition.detailUrlPrefix}${row.id}` ||
      row.evidence[0]?.url !== row.officialUrl
    )
      issue('原典IDの公式詳細リンクを固定する');
  });

export const culturalHeritageSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    seriesKey: z.literal(definition.seriesKey),
    scope: z.literal(definition.scope),
    observedDate: z.literal(definition.observedDate),
    generatedAt: z.string().datetime(),
    source: z
      .object({
        title: z.literal(definition.title),
        url: z.literal(definition.url),
        factsSha256: z.literal(definition.factsSha256),
        rawManifestSha256: sha,
      })
      .strict(),
    records: z.array(record).length(definition.counts.uniqueRecords),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (
      new Set(snapshot.records.map((row) => row.id)).size !==
      definition.counts.uniqueRecords
    )
      issue('同一文化財IDは全国で1件');
    if (
      snapshot.records.some(
        (row, index, rows) =>
          index > 0 && Number(rows[index - 1].id) >= Number(row.id)
      )
    )
      issue('数値ID順を固定し異なる表記の同一IDを重複させない');
    for (const category of definition.categories)
      if (
        snapshot.records.filter((row) => row.kinds.includes(category.key))
          .length !== category.recordIds.length
      )
        issue('3種の全検索件数を保持する');
    if (
      snapshot.records.reduce(
        (sum, row) => sum + row.prefectureCodes.length,
        0
      ) !== definition.counts.prefectureMemberships
    )
      issue('県所属の延べ162件を保持する');
    if (
      snapshot.records.filter((row) => row.geography === 'unspecified')
        .length !== definition.counts.unspecifiedRecords
    )
      issue('地域無指定14件を県へ配分しない');
    if (
      snapshot.records.filter((row) => row.location === null).length !==
      definition.counts.missingLocations
    )
      issue('所在地未記載4件を補完しない');
  });
export type CulturalHeritageSnapshot = z.infer<
  typeof culturalHeritageSnapshotSchema
>;
export type CulturalHeritageKind = z.infer<typeof kind>;

export function parseCulturalHeritageSnapshot(
  raw: unknown
): CulturalHeritageSnapshot | null {
  const result = culturalHeritageSnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
/** Stable facts exclude server tokens, collection time and source HTML bytes. */
export async function hashCulturalHeritageFacts(
  records: CulturalHeritageSnapshot['records']
) {
  const facts = records.map(
    ({
      id,
      name,
      kinds,
      rawPrefecture,
      location,
      geography,
      prefectureCodes,
      officialUrl,
    }) => ({
      id,
      name,
      kinds,
      rawPrefecture,
      location,
      geography,
      prefectureCodes,
      officialUrl,
    })
  );
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(facts))
  );
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');
}
export async function verifyCulturalHeritageSnapshot(
  raw: unknown
): Promise<CulturalHeritageSnapshot | null> {
  const snapshot = parseCulturalHeritageSnapshot(raw);
  if (!snapshot) return null;
  return (await hashCulturalHeritageFacts(snapshot.records)) ===
    definition.factsSha256
    ? snapshot
    : null;
}
