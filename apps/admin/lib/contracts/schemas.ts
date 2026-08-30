import { z } from 'zod';

/** 管理画面が読む各SSOTの検証スキーマ。書き込み/action body は定義しない。 */

export const ContentSocialPostsState = z.object({
  posts: z.array(
    z
      .object({
        platform: z.string(),
        status: z.string(),
      })
      .passthrough()
  ),
});

export const ContentKdpListing = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    status: z.string(),
    priceYen: z.number().finite(),
    asin: z.string().nullable().optional(),
    draftId: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    lastSubmittedAt: z.string().nullable().optional(),
    salesStartedAt: z.string().nullable().optional(),
    kdpStatus: z.enum(['draft', 'in_review', 'live', 'unknown']).optional(),
    kdpStatusLabel: z.string().nullable().optional(),
    kdpStatusCheckedAt: z.string().nullable().optional(),
    royaltyPlan: z.union([z.literal(35), z.literal(70)]).optional(),
    kuEnrolled: z.boolean().optional(),
    epubPath: z.string(),
    coverPath: z.string(),
  })
  .passthrough();

export const ContentKdpListingsState = z.object({
  listings: z.record(ContentKdpListing),
});

export const ContentKindleBuildState = z.object({
  generatedAt: z.string().optional(),
  books: z.array(
    z
      .object({
        id: z.string().min(1),
        status: z.string(),
      })
      .passthrough()
  ),
});

export const ContentKindleArchiveState = z.object({
  schemaVersion: z.literal(1),
  archiveFormat: z.string(),
  bucket: z.string(),
  prefix: z.string(),
  generatedAt: z.string(),
  books: z.record(
    z
      .object({
        id: z.string(),
        version: z.string(),
        latestRevision: z.string(),
        revisions: z.array(
          z
            .object({
              revision: z.string(),
              archivedAt: z.string(),
              verifiedAt: z.string(),
              remotePrefix: z.string(),
              manifestSha256: z.string(),
              files: z.array(
                z
                  .object({
                    name: z.string(),
                    plainSha256: z.string(),
                    plainSize: z.number().int().nonnegative(),
                  })
                  .passthrough()
              ),
            })
            .passthrough()
        ),
      })
      .passthrough()
  ),
});

export const ContentNoteDraftIndex = z.object({
  drafts: z.record(
    z
      .object({
        status: z.string(),
      })
      .passthrough()
  ),
});

export const ContentReferenceInventory = z.object({
  sourceKey: z.string(),
  edition: z.string(),
  items: z.array(
    z
      .object({
        id: z.string(),
        resolution: z.string(),
        primarySource: z
          .object({
            organization: z.string().optional(),
            publicationOrDataset: z.string().optional(),
            url: z.string().optional(),
          })
          .passthrough()
          .optional(),
        mapping: z
          .object({
            metricKeys: z.array(z.string()).optional(),
            areaCodes: z.array(z.string()).optional(),
            surveyIds: z.array(z.string()).optional(),
            geoScopes: z.array(z.string()).optional(),
            contentRoles: z.array(z.string()).optional(),
            internalFiles: z.array(z.string()).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
  ),
});

export const ContentBlogIndex = z.object({
  articles: z.array(
    z
      .object({
        slug: z.string(),
        title: z.string(),
        filePath: z.string(),
        published: z.boolean(),
      })
      .passthrough()
  ),
});

export const ContentPrefectures = z.array(
  z.object({ prefCode: z.string(), prefName: z.string() }).passthrough()
);

/**
 * query の limit パース (非負有限整数のみ。NaN/Infinity/負 → 不正)。
 * 返り値: 有効なら number、指定なしなら null、不正なら "invalid"。
 */
export function parseLimit(raw: string | null): number | null | 'invalid' {
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return 'invalid';
  return n;
}
