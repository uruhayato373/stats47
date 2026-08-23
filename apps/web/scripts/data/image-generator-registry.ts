export const SATORI_RENDERER_SOURCES = [
  'apps/web/scripts/lib/satori-image-render.ts',
  'apps/web/src/features/ogp/brand.ts',
  'node_modules/@expo-google-fonts/noto-sans-jp/400Regular/NotoSansJP_400Regular.ttf',
  'node_modules/@expo-google-fonts/noto-sans-jp/700Bold/NotoSansJP_700Bold.ttf',
  'node_modules/@expo-google-fonts/noto-sans-jp/900Black/NotoSansJP_900Black.ttf',
  'node_modules/react/package.json',
  'node_modules/satori/package.json',
  'node_modules/sharp/package.json',
] as const;

export const BLOG_IMAGE_GENERATOR_SPEC = {
  generator: 'blog-ogp',
  rendererSources: [
    ...SATORI_RENDERER_SOURCES,
    'apps/web/scripts/lib/blog-ai-background-normalizer.ts',
    'apps/web/scripts/lib/blog-thumbnail-render.ts',
    'apps/web/scripts/lib/blog-image-render.ts',
  ],
  brandBackgroundSources: [
    'apps/web/scripts/lib/assets/ogp-bg-brand-light.jpg',
    'apps/web/scripts/lib/assets/ogp-bg-brand-dark.jpg',
  ],
} as const;

export const BLOG_AI_BACKGROUND_NORMALIZER_SOURCES = [
  'apps/web/scripts/lib/blog-ai-background-normalizer.ts',
  'node_modules/sharp/package.json',
] as const;

export function blogRendererSources(
  backgroundSource: 'brand' | 'ai'
): readonly string[] {
  const sharedSources = BLOG_IMAGE_GENERATOR_SPEC.rendererSources.filter(
    (source) => source !== BLOG_AI_BACKGROUND_NORMALIZER_SOURCES[0]
  );
  if (backgroundSource === 'brand') {
    return [
      ...sharedSources,
      ...BLOG_IMAGE_GENERATOR_SPEC.brandBackgroundSources,
    ];
  }
  return BLOG_IMAGE_GENERATOR_SPEC.rendererSources;
}

export const IMAGE_GENERATOR_SPECS = {
  ranking: {
    generator: 'ranking-ogp',
    rendererSources: [
      ...SATORI_RENDERER_SOURCES,
      'apps/web/src/features/ogp/RankingOgp.tsx',
      'apps/web/src/features/ogp/JapanMapSvg.tsx',
      'apps/web/src/features/ogp/brand.ts',
      'apps/web/scripts/lib/blog-thumbnail-render.ts',
      'apps/web/scripts/lib/ranking-ogp-fallback-render.ts',
    ],
  },
  areas: {
    generator: 'area-ogp',
    rendererSources: [
      ...SATORI_RENDERER_SOURCES,
      'apps/web/scripts/lib/pref-silhouette-render.ts',
      'apps/web/scripts/data/pref-silhouette-tokens.ts',
      'apps/remotion/public/prefecture.topojson',
      'node_modules/d3-geo/package.json',
      'node_modules/topojson-client/package.json',
    ],
  },
  'ranking-cards': {
    generator: 'ranking-card',
    rendererSources: [
      ...SATORI_RENDERER_SOURCES,
      'apps/web/scripts/lib/ranking-thumbnail-render.ts',
      'packages/ranking/package.json',
      'packages/ranking/src/types/ranking-thumbnail.ts',
      'packages/visualization/src/server/generate-ranking-thumbnail-map-svg.ts',
      'packages/visualization/src/server/generate-mini-prefecture-svg.ts',
      'packages/visualization/src/server/prefecture-topology.generated.json',
      // ★配色カタログ (2026-07-31)。generate-mini-prefecture-svg が手書き 9 種の
      //   INTERPOLATORS をやめてカタログ経由の解決に変わったため、renderer の依存に入る。
      //   package.json だけだと**カタログを編集しても hash が変わらず**、
      //   色を変えたのにキャッシュ済みサムネが古いままになる。実体も列挙する。
      'packages/types/package.json',
      'packages/types/src/color-scheme.ts',
      'node_modules/d3-geo/package.json',
      'node_modules/d3-scale-chromatic/package.json',
      'node_modules/topojson-client/package.json',
    ],
  },
  'note-covers': {
    generator: 'note-cover',
    rendererSources: [
      ...SATORI_RENDERER_SOURCES,
      'apps/web/scripts/lib/blog-thumbnail-render.ts',
      'apps/web/scripts/lib/note-cover-render.ts',
    ],
  },
  'pref-silhouette': {
    generator: 'prefecture-silhouette',
    rendererSources: [
      ...SATORI_RENDERER_SOURCES,
      'apps/web/scripts/lib/pref-silhouette-render.ts',
      'apps/web/scripts/data/pref-silhouette-tokens.ts',
      'apps/remotion/public/prefecture.topojson',
      'node_modules/d3-geo/package.json',
      'node_modules/topojson-client/package.json',
    ],
  },
} as const;

export type ImageGeneratorType = keyof typeof IMAGE_GENERATOR_SPECS;

export const IMAGE_GENERATOR_TYPES = Object.freeze(
  Object.keys(IMAGE_GENERATOR_SPECS) as ImageGeneratorType[]
);
