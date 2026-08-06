import { createHash } from 'node:crypto';

export const BLOG_CODEX_BACKGROUND_SCHEMA_VERSION = 1;
export const BLOG_CODEX_BACKGROUND_PROVIDER = 'openai-codex-mcp';
export const BLOG_CODEX_BACKGROUND_TOOL = 'imagegen';
export const BLOG_CODEX_BACKGROUND_LEGACY_MODEL =
  'codex-imagegen-built-in';
export const BLOG_CODEX_BACKGROUND_MODEL = 'gpt-image-2';
export const BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION =
  'blog-codex-minimal-v1';
export const BLOG_CODEX_BACKGROUND_PROMPT_VERSION = 'blog-codex-minimal-v2';
export const BLOG_CODEX_BACKGROUND_ASSET_DIR =
  'apps/web/scripts/lib/assets/blog-codex-backgrounds';

export interface BlogCodexBackgroundDef {
  assetId: string;
  assetPath: string;
  subject: string;
  detail: string;
  model: string;
  promptVersion: string;
}

function background(
  assetId: string,
  subject: string,
  detail: string,
  model = BLOG_CODEX_BACKGROUND_MODEL,
  promptVersion = BLOG_CODEX_BACKGROUND_PROMPT_VERSION
): BlogCodexBackgroundDef {
  return {
    assetId,
    assetPath: `${BLOG_CODEX_BACKGROUND_ASSET_DIR}/${assetId}.jpg`,
    subject,
    detail,
    model,
    promptVersion,
  };
}

function legacyBackground(
  assetId: string,
  subject: string,
  detail: string
): BlogCodexBackgroundDef {
  return background(
    assetId,
    subject,
    detail,
    BLOG_CODEX_BACKGROUND_LEGACY_MODEL,
    BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION
  );
}

const PICKLED_SEAFOOD_JAR = legacyBackground(
  'pickled-seafood-jar',
  'one glass jar of Japanese pickled seafood',
  'A transparent jar containing simple pieces of pickled fish, with no label.'
);
const TUNA = background(
  'tuna',
  'one tuna fish',
  'An immediately recognizable side-view tuna with restrained detail.'
);

/**
 * 新着ブログ用 Codex 背景。
 *
 * 画像は「主役 1 つ / 左 62% をタイトル安全域 / 右 35% に主役」で統一する。
 * 同じ主題の記事は背景を共有し、タイトルの決定的合成で区別する。
 */
export const BLOG_CODEX_BACKGROUND_BY_SLUG: Readonly<
  Record<string, BlogCodexBackgroundDef>
> = {
  'avg-height-high-school-2nd-male-vs-fish-pickled-consumption':
    PICKLED_SEAFOOD_JAR,
  'tuna-consumption-quantity-vs-national-medical-expense-per': TUNA,
  'dual-income-household-ratio-vs-floor-area-per-dwelling-owner':
    legacyBackground(
    'house',
    'one simple detached Japanese house',
    'A clean front three-quarter view with a roof, door, and two windows.'
  ),
  'tuna-consumption-quantity-vs-annual-new-inpatients-general': TUNA,
  'heating-cost-vs-disposable-income': legacyBackground(
    'heater',
    'one compact kerosene space heater',
    'A recognizable freestanding Japanese winter heater with restrained vent details.'
  ),
  'tutoring-cost-university-advancement-gap': legacyBackground(
    'school-desk',
    'one simple school study desk',
    'A tidy desk with one closed notebook, treated as one unified motif.'
  ),
  'black-tea-income-gap': legacyBackground(
    'tea-cup',
    'one elegant cup of black tea',
    'A single teacup with a small handle and a calm dark amber tea surface.'
  ),
  'real-disposable-income-reversal': legacyBackground(
    'house-key',
    'one simple house key',
    'A clean metal key with a small house-shaped bow and no keyring.'
  ),
  'unhealthy-period-gender-prefecture-gap': legacyBackground(
    'gender-silhouettes',
    'one unified pair of two anonymous adult silhouettes',
    'Two side-by-side silhouettes of equal visual weight with no facial features.'
  ),
  'deposit-securities-prefecture-personality': legacyBackground(
    'bankbook',
    'one closed Japanese-style bank passbook',
    'A small navy passbook with a blank pale rectangle and no writing.'
  ),
  'natto-production-vs-consumption': legacyBackground(
    'natto-pack',
    'one open square natto container',
    'A recognizable white fermented-soybean pack with no chopsticks or label.'
  ),
  'distinctive-place-name-kanji-by-prefecture': legacyBackground(
    'ink-brush',
    'one traditional Japanese ink brush',
    'A single diagonal calligraphy brush with no ink marks or written characters.'
  ),
  'hama-ura-tsu-coastal-place-names': legacyBackground(
    'coastal-wave',
    'one simple curling coastal wave',
    'A restrained single wave shape suggesting a coastline.'
  ),
  'kawa-gawa-river-place-name-map': legacyBackground(
    'river',
    'one winding river ribbon',
    'A single smooth blue river with no banks, bridges, boats, or labels.'
  ),
  'yato-yatsu-place-name-boundary': legacyBackground(
    'valley',
    'one simple V-shaped valley landform',
    'A minimal valley between two softly sloped hills, treated as one motif.'
  ),
  'development-history-place-name-map': legacyBackground(
    'rice-field',
    'one unified terraced rice-field motif',
    'Three simple stepped paddy bands with no farmhouse, people, or tools.'
  ),
  'elderly-population-care-capacity-gap': legacyBackground(
    'care-home',
    'one simple elderly care-home building',
    'A calm low-rise care facility with a blank entrance canopy.'
  ),
  'foreign-resident-five-percent-municipalities': legacyBackground(
    'globe',
    'one simple globe',
    'A clean blue globe with abstract continent shapes and no precise borders.'
  ),
  'half-population-elderly-municipalities': legacyBackground(
    'elderly-person',
    'one anonymous elderly-person silhouette',
    'A dignified standing older adult with a subtle cane and no facial features.'
  ),
  'homeownership-vacancy-four-types': legacyBackground(
    'empty-house',
    'one simple empty detached house',
    'A quiet vacant house with one dark window and a closed door.'
  ),
  'low-cost-low-income-prefectures': legacyBackground(
    'wallet',
    'one simple closed wallet',
    'A clean indigo wallet with a subtle clasp and no money or cards.'
  ),
  'manufacturing-output-outlier-cities': legacyBackground(
    'factory',
    'one simple factory building',
    'A compact plant silhouette with one smokeless chimney and a sawtooth roof.'
  ),
  'municipalities-without-general-hospitals': legacyBackground(
    'hospital',
    'one simple hospital building',
    'A clean low-rise hospital facade with one universal medical cross.'
  ),
  'municipalities-without-schools': legacyBackground(
    'school',
    'one simple Japanese elementary-school building',
    'A clean two-story school facade with blank windows and one entrance.'
  ),
};

export function buildCodexBackgroundPrompt(
  def: BlogCodexBackgroundDef
): string {
  return [
    'Minimal flat-vector editorial background for a Japanese statistics blog.',
    `Create ${def.subject}. ${def.detail}`,
    ...(def.promptVersion === BLOG_CODEX_BACKGROUND_PROMPT_VERSION
      ? ['Use a 1200 by 630 canvas with a 1.91 to 1 aspect ratio.']
      : []),
    'Use a plain warm off-white background and a muted indigo, slate-blue, pale-blue-gray palette.',
    'Keep the entire LEFT 62 PERCENT completely blank for title text.',
    'Place the sole subject entirely in the RIGHTMOST 35 PERCENT with generous edge padding.',
    'No unrelated objects, text, letters, numbers, logos, labels, watermark, maps, charts, decorative circles, patterns, people unless explicitly requested, photorealism, or dense texture.',
  ].join(' ');
}

export function computeCodexBackgroundPromptHash(
  def: BlogCodexBackgroundDef
): string {
  const input = JSON.stringify(
    def.promptVersion === BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION
      ? {
          model: def.model,
          promptVersion: def.promptVersion,
          prompt: buildCodexBackgroundPrompt(def),
        }
      : {
          schemaVersion: BLOG_CODEX_BACKGROUND_SCHEMA_VERSION,
          provider: BLOG_CODEX_BACKGROUND_PROVIDER,
          tool: BLOG_CODEX_BACKGROUND_TOOL,
          model: def.model,
          promptVersion: def.promptVersion,
          prompt: buildCodexBackgroundPrompt(def),
        }
  );
  return `sha256-${createHash('sha256').update(input).digest('hex')}`;
}
