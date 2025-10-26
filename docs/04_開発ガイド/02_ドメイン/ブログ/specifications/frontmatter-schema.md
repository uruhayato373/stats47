---
title: フロントマタースキーマ定義
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/blog
  - specifications
---

# フロントマタースキーマ定義

## 概要

MDXファイルのフロントマター（メタデータ）の構造とバリデーション仕様を定義します。記事の管理、SEO最適化、可視化設定を統一的に管理します。

## スキーマ定義

### 基本スキーマ

```typescript
// src/types/blog.ts

import { z } from 'zod';

// カテゴリ定義
const CategorySchema = z.enum([
  'population',    // 人口統計
  'economy',       // 経済統計
  'society',       // 社会統計
  'environment',   // 環境統計
  'tutorial',      // チュートリアル
  'news'          // ニュース
]);

// 可視化設定スキーマ
const ChartSettingsSchema = z.object({
  colorScheme: z.enum(['blue', 'red', 'green', 'purple', 'orange']).optional(),
  type: z.enum(['sequential', 'diverging', 'categorical']).optional(),
  useMinValueForScale: z.boolean().optional(),
  centerType: z.enum(['zero', 'mean', 'median']).optional(),
  height: z.number().min(200).max(800).optional(),
  showLegend: z.boolean().optional(),
  showTooltip: z.boolean().optional(),
});

// SEO設定スキーマ
const SEOSchema = z.object({
  ogImage: z.string().url().optional(),
  ogType: z.enum(['article', 'website']).optional(),
  keywords: z.array(z.string()).max(10).optional(),
  canonical: z.string().url().optional(),
  noindex: z.boolean().optional(),
  nofollow: z.boolean().optional(),
});

// フロントマタースキーマ
export const FrontmatterSchema = z.object({
  // 必須フィールド
  title: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'スラッグは小文字、数字、ハイフンのみ使用可能'),
  date: z.string().datetime(),
  description: z.string().min(1).max(200),
  author: z.string().min(1).max(50),

  // カテゴリ・タグ
  category: CategorySchema,
  tags: z.array(z.string().min(1).max(20)).min(1).max(10),

  // 可視化設定
  chartSettings: ChartSettingsSchema.optional(),

  // SEO設定
  seo: SEOSchema.optional(),

  // オプションフィールド
  draft: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  series: z.string().max(50).optional(),
  seriesOrder: z.number().int().min(1).optional(),
  relatedArticles: z.array(z.string()).max(5).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
  lastModified: z.string().datetime().optional(),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;
export type ChartSettings = z.infer<typeof ChartSettingsSchema>;
export type SEOSettings = z.infer<typeof SEOSchema>;
```

## フィールド詳細

### 必須フィールド

#### title
- **型**: `string`
- **制約**: 1-100文字
- **説明**: 記事のタイトル
- **例**: `"都道府県別人口ランキング2024"`

#### slug
- **型**: `string`
- **制約**: 小文字、数字、ハイフンのみ、1-50文字
- **説明**: URLスラッグ（一意である必要がある）
- **例**: `"prefecture-population-ranking-2024"`

#### date
- **型**: `string` (ISO 8601形式)
- **制約**: 有効な日時文字列
- **説明**: 公開日
- **例**: `"2024-12-15T00:00:00Z"`

#### description
- **型**: `string`
- **制約**: 1-200文字
- **説明**: メタディスクリプション
- **例**: `"2024年の都道府県別人口ランキングを分析し、地域格差の実態を可視化します。"`

#### author
- **型**: `string`
- **制約**: 1-50文字
- **説明**: 著者名
- **例**: `"stats47編集部"`

### カテゴリ・タグ

#### category
- **型**: `enum`
- **選択肢**: `population`, `economy`, `society`, `environment`, `tutorial`, `news`
- **説明**: 記事の主要カテゴリ
- **例**: `"population"`

#### tags
- **型**: `string[]`
- **制約**: 1-10個、各タグは1-20文字
- **説明**: 記事に関連するタグ
- **例**: `["人口", "ランキング", "都道府県", "統計"]`

### 可視化設定

#### chartSettings
- **型**: `object` (オプション)
- **説明**: 記事内の可視化コンポーネントのデフォルト設定

```yaml
chartSettings:
  colorScheme: "blue"              # カラースキーム
  type: "sequential"               # 可視化タイプ
  useMinValueForScale: true        # 最小値でのスケール使用
  centerType: "zero"               # 中心値のタイプ
  height: 400                      # コンポーネントの高さ
  showLegend: true                 # 凡例表示
  showTooltip: true                # ツールチップ表示
```

### SEO設定

#### seo
- **型**: `object` (オプション)
- **説明**: SEO最適化のための設定

```yaml
seo:
  ogImage: "/images/og/article-slug.png"  # OGP画像URL
  ogType: "article"                       # OGPタイプ
  keywords:                               # キーワード
    - 人口
    - 統計
    - データ分析
  canonical: "https://stats47.com/blog/article-slug"  # 正規URL
  noindex: false                          # インデックス禁止
  nofollow: false                         # フォロー禁止
```

### オプションフィールド

#### draft
- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: 下書きフラグ（trueの場合は公開されない）

#### featured
- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: 注目記事フラグ（トップページなどで強調表示）

#### series
- **型**: `string`
- **制約**: 最大50文字
- **説明**: シリーズ名（連載記事用）

#### seriesOrder
- **型**: `number`
- **制約**: 1以上の整数
- **説明**: シリーズ内での順序

#### relatedArticles
- **型**: `string[]`
- **制約**: 最大5個
- **説明**: 関連記事のスラッグ配列

#### readingTime
- **型**: `number`
- **制約**: 1-60分
- **説明**: 読了時間（分）

#### lastModified
- **型**: `string` (ISO 8601形式)
- **説明**: 最終更新日

## バリデーション

### スキーマバリデーション

```typescript
// src/infrastructure/blog/frontmatter.ts

import { FrontmatterSchema } from '@/types/blog';

export function validateFrontmatter(data: unknown): Frontmatter {
  try {
    return FrontmatterSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`フロントマター検証エラー: ${errorMessages}`);
    }
    throw error;
  }
}
```

### カスタムバリデーション

```typescript
// スラッグの一意性チェック
export async function validateSlugUniqueness(slug: string, excludeSlug?: string) {
  const existingArticles = await getAllBlogArticles();
  const isDuplicate = existingArticles.some(article => 
    article.slug === slug && article.slug !== excludeSlug
  );
  
  if (isDuplicate) {
    throw new Error(`スラッグ "${slug}" は既に使用されています`);
  }
}

// 関連記事の存在チェック
export async function validateRelatedArticles(relatedArticles: string[]) {
  const existingSlugs = await getAllBlogSlugs();
  const invalidSlugs = relatedArticles.filter(slug => !existingSlugs.includes(slug));
  
  if (invalidSlugs.length > 0) {
    throw new Error(`存在しない関連記事: ${invalidSlugs.join(', ')}`);
  }
}
```

## デフォルト値

### カテゴリ別デフォルト設定

```typescript
// src/config/frontmatter-defaults.ts

export const categoryDefaults = {
  population: {
    chartSettings: {
      colorScheme: 'blue',
      type: 'sequential',
      useMinValueForScale: true,
    },
    tags: ['人口', '統計'],
  },
  economy: {
    chartSettings: {
      colorScheme: 'green',
      type: 'sequential',
      useMinValueForScale: false,
    },
    tags: ['経済', 'GDP'],
  },
  society: {
    chartSettings: {
      colorScheme: 'purple',
      type: 'categorical',
    },
    tags: ['社会', '教育'],
  },
  environment: {
    chartSettings: {
      colorScheme: 'green',
      type: 'sequential',
    },
    tags: ['環境', 'エネルギー'],
  },
  tutorial: {
    chartSettings: {
      colorScheme: 'blue',
      type: 'sequential',
      showLegend: true,
      showTooltip: true,
    },
    tags: ['チュートリアル', '可視化'],
  },
  news: {
    chartSettings: {
      colorScheme: 'orange',
      type: 'categorical',
    },
    tags: ['ニュース', '統計発表'],
  },
};
```

## フロントマター生成

### テンプレート生成

```typescript
// src/infrastructure/blog/template-generator.ts

export function generateFrontmatterTemplate(category: string): string {
  const defaults = categoryDefaults[category];
  
  return `---
title: "記事タイトル"
slug: "article-slug"
date: "${new Date().toISOString()}"
description: "記事の説明文"
author: "stats47編集部"
category: "${category}"
tags: ${JSON.stringify(defaults.tags)}
chartSettings: ${JSON.stringify(defaults.chartSettings, null, 2)}
seo:
  ogImage: "/images/og/article-slug.png"
  ogType: "article"
  keywords: ${JSON.stringify(defaults.tags)}
draft: true
---
`;
}
```

### 自動生成機能

```typescript
// スラッグ自動生成
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // 特殊文字を除去
    .replace(/\s+/g, '-')      // スペースをハイフンに
    .replace(/-+/g, '-')       // 連続するハイフンを1つに
    .trim();
}

// 読了時間自動計算
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200; // 日本語の平均読書速度
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
```

## エラーハンドリング

### バリデーションエラー

```typescript
// エラーメッセージの日本語化
export const validationMessages = {
  'string.min': '文字数が不足しています',
  'string.max': '文字数が超過しています',
  'string.regex': '形式が正しくありません',
  'array.min': '項目数が不足しています',
  'array.max': '項目数が超過しています',
  'enum': '選択肢から選択してください',
  'datetime': '日時形式が正しくありません',
  'url': 'URL形式が正しくありません',
};

// エラーメッセージのカスタマイズ
export function formatValidationError(error: z.ZodError): string {
  return error.errors.map(err => {
    const path = err.path.join('.');
    const message = validationMessages[err.code] || err.message;
    return `${path}: ${message}`;
  }).join('\n');
}
```

### 警告レベルの検証

```typescript
// 警告レベルの検証（エラーにはしないが注意喚起）
export function validateWarnings(frontmatter: Frontmatter): string[] {
  const warnings: string[] = [];
  
  // 説明文が短すぎる場合
  if (frontmatter.description.length < 50) {
    warnings.push('説明文が短いため、SEO効果が低い可能性があります');
  }
  
  // タグが少なすぎる場合
  if (frontmatter.tags.length < 3) {
    warnings.push('タグが少ないため、検索性が低い可能性があります');
  }
  
  // 読了時間が設定されていない場合
  if (!frontmatter.readingTime) {
    warnings.push('読了時間が設定されていません');
  }
  
  return warnings;
}
```

## マイグレーション

### スキーマバージョン管理

```typescript
// スキーマバージョン
export const FRONTMATTER_VERSION = '1.0.0';

// バージョン互換性チェック
export function checkSchemaCompatibility(version: string): boolean {
  const [major] = version.split('.').map(Number);
  const [currentMajor] = FRONTMATTER_VERSION.split('.').map(Number);
  return major === currentMajor;
}
```

### 既存記事の移行

```typescript
// 既存記事のフロントマター更新
export async function migrateFrontmatter(articlePath: string) {
  const content = await fs.readFile(articlePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  
  // 新しいスキーマに適合するように変換
  const migratedFrontmatter = {
    ...frontmatter,
    // 新しいフィールドのデフォルト値設定
    chartSettings: frontmatter.chartSettings || {},
    seo: frontmatter.seo || {},
  };
  
  // バリデーション
  const validated = validateFrontmatter(migratedFrontmatter);
  
  // ファイル更新
  const newContent = matter.stringify(body, validated);
  await fs.writeFile(articlePath, newContent);
}
```

## テスト

### スキーマテスト

```typescript
// src/infrastructure/blog/__tests__/frontmatter.test.ts

describe('Frontmatter Schema', () => {
  test('valid frontmatter passes validation', () => {
    const validFrontmatter = {
      title: 'Test Article',
      slug: 'test-article',
      date: '2024-01-15T00:00:00Z',
      description: 'Test description',
      author: 'Test Author',
      category: 'population',
      tags: ['test', 'article'],
    };
    
    expect(() => FrontmatterSchema.parse(validFrontmatter)).not.toThrow();
  });
  
  test('invalid frontmatter throws error', () => {
    const invalidFrontmatter = {
      title: '', // 空文字は無効
      slug: 'Invalid Slug!', // 大文字と記号は無効
      // 必須フィールドが不足
    };
    
    expect(() => FrontmatterSchema.parse(invalidFrontmatter)).toThrow();
  });
});
```

### バリデーションテスト

```typescript
describe('Frontmatter Validation', () => {
  test('slug uniqueness validation', async () => {
    await expect(validateSlugUniqueness('existing-slug')).rejects.toThrow();
    await expect(validateSlugUniqueness('new-slug')).resolves.not.toThrow();
  });
  
  test('related articles validation', async () => {
    await expect(validateRelatedArticles(['non-existent-slug'])).rejects.toThrow();
    await expect(validateRelatedArticles(['existing-slug'])).resolves.not.toThrow();
  });
});
```
