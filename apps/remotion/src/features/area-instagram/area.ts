import { z } from 'zod';

/**
 * Instagram「地域」カルーセル（火・土枠。正典 .claude/rules/sns-content-standards.md §2-3c）の
 * 入力型・検証・派生ロジック。
 *
 * props.json は `.claude/scripts/sns/build-ig-area-props.ts` が生成する（このファイルからは
 * 変更しない・読むだけ）。この生成物は既に「全国トップクラス」「全国では下位」の2グループへ
 * 選定済みなので、ここでは選定ロジックを再実装せず、(1) 型として妥当か (2) グループどうし・
 * teaser・canonicalUrl が矛盾していないか、だけを検証する。矛盾があれば throw してレンダーを
 * 失敗させる（出題とデータが食い違ったカードを作らないという ranking-quiz-instagram/quiz.ts と
 * 同じ方針）。
 *
 * 中立フレーミング規約: 「強み/弱み」とは書かない。グループ見出しは生成物の `title`
 * （既定「全国トップクラス」「全国では下位」）をそのまま使う。
 */

export const AREA_CAROUSEL_SLIDES = ['cover', 'top', 'bottom', 'sources', 'outro'] as const;
export type AreaCarouselSlide = (typeof AREA_CAROUSEL_SLIDES)[number];

export const AreaCarouselItemSchema = z.object({
  rankingKey: z.string().min(1),
  label: z.string().min(1),
  subtitle: z.string().optional(),
  value: z.number(),
  unit: z.string(),
  /** 全国順位 (1-47) */
  rank: z.number().int().min(1).max(47),
  /** 4桁年 */
  year: z.number().int().min(1900),
  source: z.string().min(1),
  /** 家計調査由来など、都道府県庁所在市の値であることの注記 */
  scopeNote: z.string().optional(),
});
export type AreaCarouselItem = z.infer<typeof AreaCarouselItemSchema>;

export const AreaCarouselGroupSchema = z.object({
  title: z.string().min(1),
  items: z.array(AreaCarouselItemSchema).min(1),
});
export type AreaCarouselGroup = z.infer<typeof AreaCarouselGroupSchema>;

export const CoverTeaserSchema = z.object({
  rankingKey: z.string().min(1),
  label: z.string().min(1),
  rank: z.number().int().min(1).max(47),
  value: z.number(),
  unit: z.string(),
});
export type CoverTeaser = z.infer<typeof CoverTeaserSchema>;

export const AreaCarouselSpecSchema = z.object({
  /** 5桁都道府県コード */
  areaCode: z.string().regex(/^\d{5}$/),
  /** 2桁都道府県コード */
  prefCode: z.string().regex(/^\d{2}$/),
  areaName: z.string().min(1),
  /** 表紙の問いかけ (例: 「山形県、全国で何位？」) */
  coverHook: z.string().min(1),
  teaser: CoverTeaserSchema.optional(),
  canonicalUrl: z.string().url(),
  groups: z.array(AreaCarouselGroupSchema).length(2),
  generatedAt: z.string(),
  sourceKeys: z.array(z.string()).optional(),
});
export type AreaCarouselSpec = z.infer<typeof AreaCarouselSpecSchema>;

export interface ResolvedAreaCarousel {
  spec: AreaCarouselSpec;
  topGroup: AreaCarouselGroup;
  bottomGroup: AreaCarouselGroup;
  /** 出典×年を重複排除した一覧 (出典スライド用。初出順) */
  sourceLines: string[];
}

/**
 * 型検証 (AreaCarouselSpecSchema) に加えて、フィールド間の矛盾を検出する。
 * どちらか一つでも欠けている・矛盾していればレンダーを失敗させる (fail-closed)。
 */
export function resolveAreaCarousel(raw: unknown): ResolvedAreaCarousel {
  const spec = AreaCarouselSpecSchema.parse(raw);
  const [topGroup, bottomGroup] = spec.groups;

  if (!spec.canonicalUrl.includes(spec.areaCode)) {
    throw new Error(
      `canonicalUrl (${spec.canonicalUrl}) に areaCode (${spec.areaCode}) が含まれていません`,
    );
  }
  if (!spec.prefCode || !spec.areaCode.startsWith(spec.prefCode)) {
    throw new Error(`areaCode (${spec.areaCode}) が prefCode (${spec.prefCode}) と整合しません`);
  }
  if (topGroup.title === bottomGroup.title) {
    throw new Error(`2つのグループの見出しが同じです (${topGroup.title})`);
  }
  if (spec.teaser) {
    const found = topGroup.items.some((item) => item.rankingKey === spec.teaser?.rankingKey);
    if (!found) {
      throw new Error(
        `teaser (${spec.teaser.rankingKey}) がトップグループ (${topGroup.title}) に含まれていません`,
      );
    }
  }

  const sourceLines: string[] = [];
  const seen = new Set<string>();
  for (const item of [...topGroup.items, ...bottomGroup.items]) {
    const line = `${item.source}（${item.year}年）`;
    if (!seen.has(line)) {
      seen.add(line);
      sourceLines.push(line);
    }
  }

  return { spec, topGroup, bottomGroup, sourceLines };
}
