#!/usr/bin/env tsx
/**
 * 静的画像 (OGP / リンクカード / note カバー) を Satori (Node) でレンダリングして
 * `.local/image-staging/<type>/<key>` に書き出す。R2 反映は生成された exact
 * publish plan を画像専用 publisher に渡す。
 *
 * 背景: ランタイム next/og は Cloudflare Worker で例外 (1101) を投げ 500 になる。
 * OGP はビルド外の Node で事前生成し R2 静的配信する (正典: .claude/rules/ogp-image-standards.md)。
 * blog OGP は同じ manifest/publisher 契約を
 * generate-blog-thumbnails{,-cloud}.ts が担当する。
 *
 * 生成のみ (push しない)。読み=公開 R2 URL + 本番 sitemap。フォントはローカル TTF (Worker と違い健全)。
 *
 * Usage:
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking       [--limit N] [--key a,b]
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type areas
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking-cards [--limit N]
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type note-covers   [--limit N] [--note-source remote|local]
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type pref-silhouette [--key 28,13]
 *
 * areas = 県シルエットカード (blue/ogp比率) を app/areas/<code>/ogp/ogp.png へ。
 * pref-silhouette = SNS 素材ライブラリ (5比率 × blue/dark) を
 *   sns/pref-silhouette/<code2>/card-<ratio>-<theme>.png へ (47県 × 10枚)。
 * どちらも lib/pref-silhouette-render.ts (トークン SSOT: data/pref-silhouette-tokens.ts)。
 *
 *   # 単一対象だけ明示的に再生成
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --key <key> --force
 *
 * 生成後の push はログに出る exact plan だけを画像専用 publisher へ渡す。
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import { createElement as h } from 'react';

import { getMetricConfig } from '@stats47/data-configs';
import {
  RANKING_THUMBNAIL_SIZE,
  RANKING_THUMBNAIL_VERSION,
  rankingThumbnailKeys,
} from '@stats47/ranking';
import {
  generateRankingThumbnailMapSvg,
  MINI_PREFECTURE_THUMBNAIL_LAYOUT,
} from '@stats47/visualization/server';

import {
  PREF_CARD_OGP_THEME,
  PREF_CARD_PUSH_THEMES,
  PREF_CARD_RATIOS,
  PREF_CARD_RATIO_KEYS,
} from './data/pref-silhouette-tokens';
import {
  IMAGE_GENERATOR_SPECS,
  IMAGE_GENERATOR_TYPES,
  type ImageGeneratorType,
} from './data/image-generator-registry';
import {
  buildImageGenerationManifest,
  calculateRendererHash,
  createImageGenerationPlan,
  createImageGenerationPublishPlan,
  selectChangedImageBatch,
  serializeImageGenerationManifest,
  type ImageGenerationPlan,
} from './lib/image-generation-manifest';
import { createImageGenerationInspector } from './lib/image-generation-r2-inspector';
import { isSafeNoteSlug } from './lib/image-entity-policy';

const PUBLIC_URL =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const SITE = process.env.SITE_ORIGIN ?? 'https://stats47.jp';
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const CONCURRENCY = 6;
loadEnv({ path: join(PROJECT_ROOT, '.env.local') });

interface CliOptions {
  type: ImageGeneratorType;
  force: boolean;
  audit: boolean;
  keys: string[] | null;
  limit: number | null;
  maxGenerate: number | null;
  source: 'sitemap' | 'known';
  noteSource: 'remote' | 'local';
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const val = (name: string): string | null => {
    const i = args.indexOf(name);
    return i !== -1 ? (args[i + 1] ?? null) : null;
  };
  const rawType = val('--type');
  if (
    !rawType ||
    !IMAGE_GENERATOR_TYPES.includes(rawType as ImageGeneratorType)
  ) {
    throw new Error(
      `--type は ${IMAGE_GENERATOR_TYPES.join(' | ')} を指定してください`
    );
  }
  const rawKey = val('--key');
  const rawLimit = val('--limit');
  const rawMax = val('--max-generate');
  const rawSource = val('--source');
  const rawNoteSource = val('--note-source');
  const parsePositiveInteger = (
    raw: string | null,
    flag: string
  ): number | null => {
    if (raw === null) return null;
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new Error(`${flag} は1以上の整数で指定してください`);
    }
    return parsed;
  };
  if (rawSource !== null && rawSource !== 'sitemap' && rawSource !== 'known') {
    throw new Error('--source は sitemap | known を指定してください');
  }
  if (
    rawNoteSource !== null &&
    rawNoteSource !== 'remote' &&
    rawNoteSource !== 'local'
  ) {
    throw new Error('--note-source は remote | local を指定してください');
  }
  if (rawNoteSource !== null && rawType !== 'note-covers') {
    throw new Error('--note-source は --type note-covers でだけ指定できます');
  }
  const keys = rawKey
    ? rawKey
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  if (keys?.some((key) => !/^[a-z0-9][a-z0-9-]*$/.test(key))) {
    throw new Error('--key に不正な値が含まれています');
  }
  return {
    type: rawType as ImageGeneratorType,
    force: args.includes('--force'),
    audit: args.includes('--audit'),
    keys,
    limit: parsePositiveInteger(rawLimit, '--limit'),
    maxGenerate: parsePositiveInteger(rawMax, '--max-generate'),
    source: rawSource === 'known' ? 'known' : 'sitemap',
    noteSource: rawNoteSource === 'local' ? 'local' : 'remote',
  };
}

async function pMap<T, R>(
  items: T[],
  fn: (item: T, i: number) => Promise<R>,
  c = CONCURRENCY
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, worker));
  return results;
}

async function fetchRequiredJson<T>(url: string): Promise<T> {
  const text = await fetchRequiredText(url);
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`画像生成入力のJSONが不正です: ${url}: ${String(error)}`);
  }
}

async function fetchRequiredText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(
      `画像生成入力の取得に失敗しました: ${url}: ${String(error)}`
    );
  }
  if (!response.ok) {
    throw new Error(
      `画像生成入力の取得に失敗しました: ${url}: HTTP ${response.status}`
    );
  }
  return response.text();
}

/**
 * ranking キーを列挙。
 * - source=sitemap (既定): 本番 sitemap (live で indexable なキー)。週次監査向け
 * - source=known: git の KNOWN_RANKING_KEYS を parse。新規公開直後 (まだ sitemap 未反映) の
 *   publish フック向け。`packages/ranking/src/config/known-ranking-keys.ts` を正規表現で読む
 */
async function listRankingKeys(source: 'sitemap' | 'known'): Promise<string[]> {
  if (source === 'known') {
    const src = readFileSync(
      join(PROJECT_ROOT, 'packages/ranking/src/config/known-ranking-keys.ts'),
      'utf8'
    );
    const keys = [...src.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)].map(
      (match) => match[1]
    );
    if (keys.length === 0) {
      throw new Error('known-ranking-keys.ts にranking keyがありません');
    }
    return [...new Set(keys)].sort();
  }
  const index = await fetchRequiredText(`${SITE}/sitemap.xml`);
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (parts.length === 0) {
    throw new Error('sitemap.xml に子 sitemap がありません');
  }
  const keys = new Set<string>();
  for (const part of parts) {
    const xml = await fetchRequiredText(part);
    for (const m of xml.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)</g))
      keys.add(m[1]);
  }
  if (keys.size === 0) {
    throw new Error('sitemap から ranking key を1件も取得できませんでした');
  }
  return [...keys].sort();
}

function listAreaCodes(): string[] {
  return Array.from(
    { length: 47 },
    (_, i) => `${String(i + 1).padStart(2, '0')}000`
  );
}

interface NoteEntry {
  slug: string;
  r2Path: string;
  vertical: string;
}
async function listNoteEntries(): Promise<NoteEntry[]> {
  const readJson = (path: string): unknown => {
    const absolute = join(PROJECT_ROOT, path);
    if (!existsSync(absolute)) return null;
    try {
      return JSON.parse(readFileSync(absolute, 'utf8')) as unknown;
    } catch (error) {
      throw new Error(`note index JSONが不正です: ${path}: ${String(error)}`);
    }
  };
  const out = new Map<string, NoteEntry>();
  const draft = readJson('.claude/state/note-draft-index.json') as {
    drafts?: Record<string, { vertical?: string; r2_path?: string }>;
  } | null;
  for (const [slug, v] of Object.entries(draft?.drafts ?? {})) {
    if (!isSafeNoteSlug(slug)) {
      throw new Error(`note slug が不正です: ${slug}`);
    }
    if (v?.r2_path) {
      if (
        v.r2_path.startsWith('/') ||
        v.r2_path.includes('\\') ||
        v.r2_path.split('/').includes('..')
      ) {
        throw new Error(`note r2_path が不正です: ${slug}`);
      }
      out.set(slug, {
        slug,
        r2Path: v.r2_path,
        vertical: v.vertical ?? 'stats47-note',
      });
    }
  }
  const pub = readJson('.claude/state/note-published-urls.json') as {
    articles?: Record<string, { vertical?: string; r2_path?: string }>;
  } | null;
  for (const [slug, v] of Object.entries(pub?.articles ?? {})) {
    if (slug.startsWith('_') || !v?.r2_path) continue;
    if (!isSafeNoteSlug(slug)) {
      throw new Error(`note slug が不正です: ${slug}`);
    }
    if (
      v.r2_path.startsWith('/') ||
      v.r2_path.includes('\\') ||
      v.r2_path.split('/').includes('..')
    ) {
      throw new Error(`note r2_path が不正です: ${slug}`);
    }
    out.set(slug, {
      slug,
      r2Path: v.r2_path,
      vertical: v.vertical ?? 'stats47-note',
    });
  }
  return [...out.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

// ─── データ導出 (R2 raw JSON → コンポーネント data) ───
interface RankingItemRaw {
  item?: {
    title?: string;
    rankingName?: string;
    seoTitle?: string;
    unit?: string;
    source?: { source?: { name?: string }; name?: string };
    availableYears?: { yearCode?: string; yearName?: string }[];
    latestYear?: { yearCode?: string; yearName?: string };
  };
}
interface ValuesRaw {
  partitions?: {
    yearCode?: string;
    values?: {
      areaCode?: string;
      areaName?: string;
      value?: number | null;
      rank?: number;
    }[];
  }[];
}

async function buildRankingOgpData(key: string) {
  const itemPayload = await fetchRequiredJson<RankingItemRaw>(
    `${PUBLIC_URL}/app/ranking/${key}/item.json`
  );
  const it = itemPayload?.item;
  if (!it?.title && !it?.rankingName) {
    throw new Error(`${key}: ranking itemにtitleがありません`);
  }
  const title = it.seoTitle ?? it.title ?? it.rankingName ?? '';
  const unit = it.unit ?? '';
  const source = it.source?.source?.name ?? it.source?.name ?? 'e-Stat';
  const latestYear =
    it.availableYears?.[it.availableYears.length - 1]?.yearCode ??
    it.latestYear?.yearCode ??
    '';
  const values = await fetchRequiredJson<ValuesRaw>(
    `${PUBLIC_URL}/app/ranking/${key}/values.json`
  );
  const partition =
    values?.partitions?.find((p) => p.yearCode === latestYear) ??
    values?.partitions?.[values.partitions.length - 1];
  const rows = (partition?.values ?? [])
    .filter(
      (v) =>
        v.value !== null && v.value !== undefined && typeof v.rank === 'number'
    )
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  const top3 = rows.slice(0, 3).map((v) => ({
    rank: v.rank as number,
    name: v.areaName ?? '',
    value: v.value as number,
  }));
  const last = rows.length > 0 ? rows[rows.length - 1] : null;
  if (rows.length === 0 || !top3[0]) {
    throw new Error(`${key}: ranking valuesに描画可能な行がありません`);
  }
  return {
    ogp: {
      title: it.title ?? it.rankingName ?? '',
      seoTitle: title,
      unit,
      source,
      top3,
      last: last
        ? {
            rank: last.rank as number,
            name: last.areaName ?? '',
            value: last.value as number,
          }
        : null,
    },
    latestYearName:
      it.availableYears?.[it.availableYears.length - 1]?.yearName ??
      it.latestYear?.yearName ??
      '',
    latestYear,
    rows,
  };
}

type BuiltRankingData = NonNullable<
  Awaited<ReturnType<typeof buildRankingOgpData>>
>;

interface PreparedImage {
  id: string;
  plan: ImageGenerationPlan;
  rankingData?: BuiltRankingData;
  metricConfig?: ReturnType<typeof getMetricConfig>;
  note?: NoteEntry & { title: string };
}

/** draft.md frontmatter の title を抜く。 */
function parseTitle(md: string): string | null {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = m ? m[1] : '';
  const line = block.match(/^title:\s*(.+)$/m);
  if (!line) return null;
  let v = line[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  )
    v = v.slice(1, -1);
  return v || null;
}

async function main() {
  const opts = parseArgs();
  if (opts.force && !opts.keys) {
    throw new Error(
      '--force は全件指定できません。必ず --key で対象を明示してください。'
    );
  }
  const publishPlanPath = join(
    PROJECT_ROOT,
    `.local/image-generation-publish-plan-${opts.type}.json`
  );
  const stageRootRelative = `.local/image-staging/${opts.type}`;
  const stageRoot = join(PROJECT_ROOT, stageRootRelative);
  rmSync(stageRoot, { recursive: true, force: true });
  rmSync(publishPlanPath, { force: true });
  console.log(`type=${opts.type} 公開URL=${PUBLIC_URL} stage=${stageRoot}`);

  // 対象列挙 (render lib 不要 = 監査は native binding なしで完結)
  let ids: string[];
  let noteEntries: NoteEntry[] = [];
  if (opts.type === 'note-covers') {
    // koumuin-claude-code / koumuin-estat-claude-code は bespoke カバーが正典
    // (.claude/scripts/note/generate-koumuin-covers.cjs → docs/31 → note.com アップロード)。
    // 汎用 Satori カバーで R2 に別デザインを焼くと二重 SSOT になるため除外する。
    // 正典: .claude/rules/ogp-image-standards.md §5。koumuin-gis / stats47-note は対象のまま。
    const BESPOKE_COVER_VERTICALS = new Set([
      'koumuin-claude-code',
      'koumuin-estat-claude-code',
    ]);
    noteEntries = (await listNoteEntries()).filter(
      (n) => !BESPOKE_COVER_VERTICALS.has(n.vertical)
    );
    ids = noteEntries.map((n) => n.slug);
  } else if (opts.type === 'areas') {
    ids = listAreaCodes();
  } else if (opts.type === 'pref-silhouette') {
    // 2 桁県コード "01".."47" (SNS 素材の content_key)
    ids = listAreaCodes().map((c) => c.slice(0, 2));
  } else {
    ids = opts.keys ?? (await listRankingKeys(opts.source));
  }
  if (opts.keys) {
    const knownIds = new Set(ids);
    const missing = opts.keys.filter((id) => !knownIds.has(id));
    if (
      missing.length > 0 &&
      opts.type !== 'ranking' &&
      opts.type !== 'ranking-cards'
    ) {
      throw new Error(`指定 key が生成対象にありません: ${missing.join(', ')}`);
    }
    ids = ids.filter((id) => opts.keys!.includes(id));
  }
  console.log(`候補: ${ids.length} 件`);

  const stagePath = (key: string): string => {
    if (
      key.startsWith('/') ||
      key.includes('\\') ||
      key.split('/').includes('..')
    ) {
      throw new Error(`画像 staging key が不正です: ${key}`);
    }
    const path = resolve(stageRoot, key);
    if (!path.startsWith(`${resolve(stageRoot)}/`)) {
      throw new Error(`画像 staging外を指すkeyです: ${key}`);
    }
    mkdirSync(dirname(path), { recursive: true });
    return path;
  };

  const assetContractsFor = (id: string) => {
    if (opts.type === 'ranking') {
      return [
        {
          key: `app/ranking/${id}/ogp/ogp.png`,
          variant: 'ogp',
          contentType: 'image/png' as const,
          width: 1200,
          height: 630,
        },
      ];
    }
    if (opts.type === 'areas') {
      return [
        {
          key: `app/areas/${id}/ogp/ogp.png`,
          variant: 'ogp',
          contentType: 'image/png' as const,
          width: PREF_CARD_RATIOS.ogp.width,
          height: PREF_CARD_RATIOS.ogp.height,
        },
      ];
    }
    if (opts.type === 'ranking-cards') {
      const keys = rankingThumbnailKeys(id);
      return [
        {
          key: keys.light,
          variant: 'light',
          contentType: 'image/webp' as const,
          ...RANKING_THUMBNAIL_SIZE,
        },
        {
          key: keys.dark,
          variant: 'dark',
          contentType: 'image/webp' as const,
          ...RANKING_THUMBNAIL_SIZE,
        },
      ];
    }
    if (opts.type === 'pref-silhouette') {
      return PREF_CARD_PUSH_THEMES.flatMap((theme) =>
        PREF_CARD_RATIO_KEYS.map((ratio) => ({
          key: `sns/pref-silhouette/${id}/card-${ratio}-${theme}.png`,
          variant: `${ratio}-${theme}`,
          contentType: 'image/png' as const,
          width: PREF_CARD_RATIOS[ratio].width,
          height: PREF_CARD_RATIOS[ratio].height,
        }))
      );
    }
    const n = noteEntries.find((e) => e.slug === id)!;
    return [
      {
        key: `${n.r2Path}/images/cover-1280x670.png`,
        variant: 'cover',
        contentType: 'image/png' as const,
        width: 1280,
        height: 670,
      },
    ];
  };

  const manifestKeyFor = (id: string): string => {
    if (opts.type === 'ranking') return `app/ranking/${id}/ogp/generation.json`;
    if (opts.type === 'areas') return `app/areas/${id}/ogp/generation.json`;
    if (opts.type === 'ranking-cards') return rankingThumbnailKeys(id).manifest;
    if (opts.type === 'pref-silhouette')
      return `sns/pref-silhouette/${id}/generation.json`;
    const n = noteEntries.find((entry) => entry.slug === id)!;
    return `${n.r2Path}/images/cover-generation.json`;
  };

  const spec = IMAGE_GENERATOR_SPECS[opts.type];
  const rendererHash = calculateRendererHash(
    PROJECT_ROOT,
    spec.rendererSources
  );
  const inspector = createImageGenerationInspector(PUBLIC_URL);
  console.log(`freshness inspector=${inspector.mode}`);
  const prepare = async (id: string): Promise<PreparedImage | null> => {
    let input: unknown;
    let rankingData: BuiltRankingData | undefined;
    let metricConfig: ReturnType<typeof getMetricConfig>;
    let note: PreparedImage['note'];

    if (opts.type === 'ranking' || opts.type === 'ranking-cards') {
      const built = await buildRankingOgpData(id);
      rankingData = built;
      metricConfig = getMetricConfig(id);
      input =
        opts.type === 'ranking'
          ? {
              ogp: built.ogp,
              latestYearName: built.latestYearName,
            }
          : {
              title: built.ogp.title,
              year: built.latestYear,
              unit: built.ogp.unit,
              topAreaName: built.ogp.top3[0].name,
              topValue: built.ogp.top3[0].value,
              rows: built.rows.map((row) => ({
                areaCode: row.areaCode,
                value: row.value,
                rank: row.rank,
              })),
              visualization: {
                colorScheme: metricConfig?.visualization?.colorScheme ?? null,
                isReversed: metricConfig?.visualization?.isReversed ?? null,
              },
              geographicLayout: MINI_PREFECTURE_THUMBNAIL_LAYOUT,
              size: RANKING_THUMBNAIL_SIZE,
              version: RANKING_THUMBNAIL_VERSION,
            };
    } else if (opts.type === 'areas') {
      input = { areaCode: id, theme: PREF_CARD_OGP_THEME };
    } else if (opts.type === 'pref-silhouette') {
      input = {
        prefectureCode: id,
        ratios: PREF_CARD_RATIO_KEYS,
        themes: PREF_CARD_PUSH_THEMES,
      };
    } else {
      const entry = noteEntries.find((candidate) => candidate.slug === id);
      if (!entry) return null;
      const localDraftPath = join(
        PROJECT_ROOT,
        '.local/r2',
        entry.r2Path,
        'draft.md'
      );
      const markdown =
        opts.noteSource === 'local'
          ? (() => {
              if (!existsSync(localDraftPath)) {
                throw new Error(
                  `${id}: local note draft がありません: ${localDraftPath}`
                );
              }
              return readFileSync(localDraftPath, 'utf8');
            })()
          : await fetchRequiredText(`${PUBLIC_URL}/${entry.r2Path}/draft.md`);
      const title = parseTitle(markdown);
      if (!title) {
        throw new Error(`${id}: note draft frontmatterにtitleがありません`);
      }
      note = { ...entry, title };
      input = { slug: id, title, vertical: entry.vertical };
    }

    const plan = createImageGenerationPlan({
      generator: spec.generator,
      entityId: id,
      manifestKey: manifestKeyFor(id),
      input,
      rendererHash,
      assets: assetContractsFor(id),
    });
    return { id, plan, rankingData, metricConfig, note };
  };

  console.log(`入力指紋を計算中 (renderer=${rendererHash.slice(0, 12)})...`);
  const prepared = (await pMap(ids, prepare, 12)).filter(
    (item): item is PreparedImage => item !== null
  );
  const unavailable = ids.length - prepared.length;
  if (unavailable > 0) console.log(`入力不足で生成不能: ${unavailable} 件`);

  const checked = await pMap(
    prepared,
    async (item) => ({
      item,
      status: await inspector.inspect(item.plan),
    }),
    12
  );
  const probeErrors = checked.filter(
    ({ status }) => status.reason === 'probe-error'
  );
  if (probeErrors.length > 0) {
    throw new Error(
      `R2 freshness probe が ${probeErrors.length} 件失敗しました。` +
        ' 障害時に全件再生成しないため処理を中止します。'
    );
  }
  const changed = opts.force
    ? checked
    : checked.filter(({ status }) => !status.isCurrent);
  const reasonCounts = new Map<string, number>();
  for (const { status } of changed) {
    reasonCounts.set(status.reason, (reasonCounts.get(status.reason) ?? 0) + 1);
  }

  // --audit: 生成せず manifest + 全 asset の欠落/陳腐化を報告する。
  if (opts.audit) {
    console.log(
      `\n監査: ${prepared.length} 件中 更新必要 ${changed.length} 件`
    );
    if (changed.length > 0) {
      console.log(
        `  理由: ${[...reasonCounts].map(([reason, count]) => `${reason}=${count}`).join(' / ')}`
      );
      const changedIds = changed.map(({ item }) => item.id);
      console.log(
        `  対象: ${changedIds.slice(0, 30).join(', ')}${
          changedIds.length > 30 ? ` … 他 ${changedIds.length - 30} 件` : ''
        }`
      );
    }
    process.exit(changed.length > 0 || unavailable > 0 ? 1 : 0);
  }
  if (unavailable > 0) {
    throw new Error(
      `入力不足の ${unavailable} 件があるため、一部だけ生成せず中止します。`
    );
  }

  // 上限超過を一部生成で隠さず fail-closed。明示 --limit で対象を分割する。
  const { targets, remaining } = selectChangedImageBatch(
    changed.map(({ item }) => item),
    { limit: opts.limit, maxGenerate: opts.maxGenerate }
  );
  if (remaining > 0) {
    console.log(
      `明示 --limit ${opts.limit}: 今回 ${targets.length} 件 / 次回以降 ${remaining} 件`
    );
  }
  console.log(
    `生成対象: ${targets.length} 件 / 現行スキップ: ${prepared.length - targets.length}` +
      (reasonCounts.size > 0
        ? ` (${[...reasonCounts].map(([reason, count]) => `${reason}=${count}`).join(' / ')})`
        : '')
  );
  if (targets.length === 0) {
    const emptyPlan = createImageGenerationPublishPlan({
      generator: spec.generator,
      stageRoot: stageRootRelative,
      items: [],
    });
    mkdirSync(dirname(publishPlanPath), { recursive: true });
    writeFileSync(publishPlanPath, `${JSON.stringify(emptyPlan, null, 2)}\n`);
    console.log(`publish plan: ${publishPlanPath} (変更なし)`);
    return;
  }

  // render lib は生成時のみ読み込む (satori/sharp)
  const { loadFonts, renderToPng, renderToWebP } =
    await import('./lib/satori-image-render');
  const fonts = loadFonts(PROJECT_ROOT);

  // 既存 OGP コンポーネント (satori 描画用)。areas は 2026-07 からシルエットカード方式
  // (lib/pref-silhouette-render.ts) に置き換え、AreaOgp は使わない。
  let RankingOgp: unknown;
  let buildRankingOgpFallbackElement:
    | typeof import('./lib/ranking-ogp-fallback-render').buildRankingOgpFallbackElement
    | null = null;
  if (opts.type === 'ranking') {
    RankingOgp = (await import('../src/features/ogp/RankingOgp')).RankingOgp;
    buildRankingOgpFallbackElement = (
      await import('./lib/ranking-ogp-fallback-render')
    ).buildRankingOgpFallbackElement;
  }
  let buildNoteCoverElement:
    | typeof import('./lib/note-cover-render').buildNoteCoverElement
    | null = null;
  if (opts.type === 'note-covers') {
    buildNoteCoverElement = (await import('./lib/note-cover-render'))
      .buildNoteCoverElement;
  }
  let renderPrefCardPng:
    | typeof import('./lib/pref-silhouette-render').renderPrefCardPng
    | null = null;
  if (opts.type === 'areas' || opts.type === 'pref-silhouette') {
    renderPrefCardPng = (await import('./lib/pref-silhouette-render'))
      .renderPrefCardPng;
  }

  let generated = 0;
  let fallback = 0;
  let skipped = 0;
  let done = 0;
  const generatedManifests = new Map<
    string,
    ReturnType<typeof buildImageGenerationManifest>
  >();
  const NOTE_SIZE = { width: 1280, height: 670 };

  const processItem = async (preparedImage: PreparedImage) => {
    const { id, plan } = preparedImage;
    try {
      const assetFiles = new Map<string, string>();
      let metadata: Record<string, unknown>;
      if (opts.type === 'ranking') {
        const built = preparedImage.rankingData!;
        const out = stagePath(plan.assets[0].key);
        try {
          await renderToPng(
            h(RankingOgp as never, { data: built.ogp }) as never,
            fonts,
            out
          );
        } catch (e) {
          if (process.env.OGP_DEBUG)
            console.log(
              `  [ranking-fallback] ${id}: ${String((e as Error)?.message ?? e).slice(0, 200)}`
            );
          // satori 非互換 → タイトルカードにフォールバック
          const el = buildRankingOgpFallbackElement!({
            title: built.ogp.title,
            latestYearName: built.latestYearName,
          });
          await renderToPng(el, fonts, out);
          fallback++;
        }
        assetFiles.set(plan.assets[0].key, out);
        metadata = {
          year: built.latestYear,
          source: {
            item: `app/ranking/${id}/item.json`,
            values: `app/ranking/${id}/values.json`,
          },
        };
      } else if (opts.type === 'areas') {
        // 県シルエットカード (blue / ogp 比率) で置き換え (2026-07 決定)
        const out = stagePath(plan.assets[0].key);
        await renderPrefCardPng!({
          projectRoot: PROJECT_ROOT,
          code2: id.slice(0, 2),
          ratio: 'ogp',
          theme: PREF_CARD_OGP_THEME,
          fonts,
          outPath: out,
        });
        assetFiles.set(plan.assets[0].key, out);
        metadata = { areaCode: id, ratio: 'ogp', theme: PREF_CARD_OGP_THEME };
      } else if (opts.type === 'pref-silhouette') {
        // 素材ライブラリ: 5 比率 × push テーマ (asset contract と同順)
        for (const theme of PREF_CARD_PUSH_THEMES) {
          for (const ratio of PREF_CARD_RATIO_KEYS) {
            const key = `sns/pref-silhouette/${id}/card-${ratio}-${theme}.png`;
            const out = stagePath(key);
            await renderPrefCardPng!({
              projectRoot: PROJECT_ROOT,
              code2: id,
              ratio,
              theme,
              fonts,
              outPath: out,
            });
            assetFiles.set(key, out);
          }
        }
        metadata = {
          prefectureCode: id,
          ratios: PREF_CARD_RATIO_KEYS,
          themes: PREF_CARD_PUSH_THEMES,
        };
      } else if (opts.type === 'ranking-cards') {
        const built = preparedImage.rankingData!;
        const config = preparedImage.metricConfig;
        const keys = rankingThumbnailKeys(id);
        const lightAsset = plan.assets.find(
          (asset) => asset.key === keys.light
        )!;
        const darkAsset = plan.assets.find((asset) => asset.key === keys.dark)!;
        const rows = built.rows.flatMap((row) =>
          row.areaCode && row.value !== null && row.value !== undefined
            ? [
                {
                  areaCode: row.areaCode,
                  value: row.value,
                  rank: row.rank,
                },
              ]
            : []
        );
        if (rows.length === 0 || !built.ogp.top3[0]) {
          skipped++;
          return;
        }
        const mapSvg = generateRankingThumbnailMapSvg(rows, {
          colorScheme: config?.visualization?.colorScheme,
          isReversed: config?.visualization?.isReversed,
          idSuffix: id,
        });
        const { buildRankingThumbnailElement, formatRankingThumbnailValue } =
          await import('./lib/ranking-thumbnail-render');
        const renderData = {
          title: built.ogp.title,
          year: built.latestYear,
          unit: built.ogp.unit,
          topAreaName: built.ogp.top3[0].name,
          topValue: formatRankingThumbnailValue(built.ogp.top3[0].value),
          mapSvg,
        };
        const lightOut = stagePath(lightAsset.key);
        const darkOut = stagePath(darkAsset.key);
        await renderToWebP(
          buildRankingThumbnailElement(renderData, false),
          fonts,
          lightOut,
          RANKING_THUMBNAIL_SIZE
        );
        await renderToWebP(
          buildRankingThumbnailElement(renderData, true),
          fonts,
          darkOut,
          RANKING_THUMBNAIL_SIZE
        );
        assetFiles.set(lightAsset.key, lightOut);
        assetFiles.set(darkAsset.key, darkOut);
        metadata = {
          version: RANKING_THUMBNAIL_VERSION,
          rankingKey: id,
          geographicLayout: MINI_PREFECTURE_THUMBNAIL_LAYOUT,
          year: built.latestYear,
          source: {
            item: `app/ranking/${id}/item.json`,
            values: `app/ranking/${id}/values.json`,
            config: `packages/data-configs/src/metrics/${id}.ts`,
            topology: 'packages/gis/data/geoshape/prefecture.topojson',
          },
          assets: {
            light: keys.light,
            dark: keys.dark,
            width: RANKING_THUMBNAIL_SIZE.width,
            height: RANKING_THUMBNAIL_SIZE.height,
            format: 'webp',
          },
        };
      } else {
        // note-covers
        const note = preparedImage.note!;
        const el = buildNoteCoverElement!(note.title);
        const out = stagePath(plan.assets[0].key);
        await renderToPng(el, fonts, out, NOTE_SIZE);
        assetFiles.set(plan.assets[0].key, out);
        metadata = { slug: id, title: note.title, vertical: note.vertical };
      }

      const manifest = buildImageGenerationManifest({
        plan,
        assetFiles,
        metadata,
      });
      generatedManifests.set(id, manifest);
      writeFileSync(
        stagePath(plan.manifestKey),
        serializeImageGenerationManifest(manifest)
      );
      generated++;
    } catch (err) {
      skipped++;
      console.log(
        `  [error] ${id}: ${String((err as Error)?.message ?? err).slice(0, 100)}`
      );
    } finally {
      done++;
      if (done % 200 === 0) console.log(`  ... ${done}/${targets.length}`);
    }
  };

  await pMap(targets, processItem, CONCURRENCY);

  console.log(
    `\n生成: ${generated} 件 (フォールバック ${fallback} / スキップ ${skipped})`
  );
  if (skipped > 0) {
    throw new Error(
      `画像生成に ${skipped} 件失敗しました。manifest/R2反映を中止してください。`
    );
  }
  const statusById = new Map(
    checked.map(({ item, status }) => [item.id, status])
  );
  const publishPlan = createImageGenerationPublishPlan({
    generator: spec.generator,
    stageRoot: stageRootRelative,
    items: targets.map(({ id, plan }) => ({
      plan,
      manifest: generatedManifests.get(id)!,
      expectedRemoteFingerprint: statusById.get(id)?.remoteFingerprint ?? null,
      expectedRemoteManifestSha256:
        statusById.get(id)?.remoteManifestSha256 ?? null,
    })),
  });
  mkdirSync(join(publishPlanPath, '..'), { recursive: true });
  writeFileSync(publishPlanPath, `${JSON.stringify(publishPlan, null, 2)}\n`);
  const prefix =
    opts.type === 'note-covers'
      ? 'note'
      : opts.type === 'areas'
        ? 'app/areas'
        : opts.type === 'pref-silhouette'
          ? 'sns/pref-silhouette'
          : 'app/ranking';
  console.log(`staging: ${stageRoot}/${prefix}`);
  console.log(`publish plan: ${publishPlanPath}`);
  console.log(
    `push: npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts --plan ${publishPlanPath}`
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
