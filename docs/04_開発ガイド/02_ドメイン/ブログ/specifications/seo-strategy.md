---
title: SEO戦略
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/blog
  - specifications
---

# SEO戦略

## 概要

ブログドメインにおけるSEO（検索エンジン最適化）戦略を定義します。検索エンジンでの可視性向上、ユーザー体験の改善、コンテンツの価値最大化を目指します。

## SEO目標

### 主要目標
1. **検索順位向上**: 統計・データ分析関連キーワードで上位表示
2. **オーガニックトラフィック増加**: 月間PV 50%向上
3. **ユーザーエンゲージメント向上**: 滞在時間・直帰率改善
4. **ブランド認知度向上**: 統計データ分析の専門サイトとしての地位確立

### ターゲットキーワード

#### プライマリキーワード
- 都道府県別ランキング
- 人口統計
- データ可視化
- 統計分析
- 地域格差

#### セカンダリキーワード
- 都道府県別GDP
- 人口推移
- コロプレス地図
- 統計データ
- データ分析手法

#### ロングテールキーワード
- 都道府県別人口ランキング2024
- 日本地図で見る統計データ
- D3.jsで作るコロプレス地図
- 統計データの可視化方法

## 技術的SEO

### メタデータ最適化

#### タイトルタグ
```typescript
// src/infrastructure/blog/seo.ts

export function generateTitle(frontmatter: Frontmatter): string {
  const { title, category, date } = frontmatter;
  const year = new Date(date).getFullYear();
  
  // カテゴリ別タイトル戦略
  const categorySuffix = {
    population: ` | 人口統計${year}`,
    economy: ` | 経済統計${year}`,
    society: ` | 社会統計${year}`,
    environment: ` | 環境統計${year}`,
    tutorial: ' | データ可視化チュートリアル',
    news: ' | 統計ニュース',
  };
  
  return `${title}${categorySuffix[category] || ''} | stats47`;
}
```

#### メタディスクリプション
```typescript
export function generateDescription(frontmatter: Frontmatter): string {
  const { description, tags, date } = frontmatter;
  const year = new Date(date).getFullYear();
  
  // キーワードを含む説明文生成
  const keywordPhrase = tags.slice(0, 3).join('・');
  return `${description} ${keywordPhrase}の詳細分析を${year}年最新データで解説。`;
}
```

#### 構造化データ
```typescript
export function generateStructuredData(article: BlogArticle): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
      url: 'https://stats47.com/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'stats47',
      logo: {
        '@type': 'ImageObject',
        url: 'https://stats47.com/logo.png',
        width: 200,
        height: 60,
      },
    },
    datePublished: article.date,
    dateModified: article.lastModified || article.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://stats47.com/blog/${article.slug}`,
    },
    image: {
      '@type': 'ImageObject',
      url: `https://stats47.com/images/og/${article.slug}.png`,
      width: 1200,
      height: 630,
    },
    keywords: article.tags.join(', '),
    articleSection: article.category,
    wordCount: article.wordCount,
    timeRequired: `PT${article.readingTime}M`,
  };
}
```

### URL構造最適化

#### URL設計
```
https://stats47.com/blog/{slug}
https://stats47.com/blog/category/{category}
https://stats47.com/blog/tag/{tag}
```

#### スラッグ生成ルール
```typescript
export function generateSEOFriendlySlug(title: string, category: string): string {
  // カテゴリ別プレフィックス
  const categoryPrefix = {
    population: 'population',
    economy: 'economy',
    society: 'society',
    environment: 'environment',
    tutorial: 'tutorial',
    news: 'news',
  };
  
  const prefix = categoryPrefix[category] || 'article';
  
  // タイトルからスラッグ生成
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${prefix}-${slug}`;
}
```

### 内部リンク戦略

#### 関連記事リンク
```typescript
export function generateInternalLinks(article: BlogArticle): InternalLink[] {
  const links: InternalLink[] = [];
  
  // カテゴリ内の関連記事
  const categoryArticles = getArticlesByCategory(article.category)
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);
  
  categoryArticles.forEach(related => {
    links.push({
      text: related.title,
      url: `/blog/${related.slug}`,
      type: 'category',
    });
  });
  
  // タグベースの関連記事
  const tagArticles = getArticlesByTags(article.tags)
    .filter(a => a.slug !== article.slug)
    .slice(0, 2);
  
  tagArticles.forEach(related => {
    links.push({
      text: related.title,
      url: `/blog/${related.slug}`,
      type: 'tag',
    });
  });
  
  return links;
}
```

#### コンテンツ内リンク
```typescript
// 自動内部リンク生成
export function generateContentLinks(content: string): string {
  const linkPatterns = [
    {
      pattern: /都道府県別(.+?)ランキング/g,
      replacement: (match: string, p1: string) => 
        `<a href="/stats/prefecture-rank/${generateSlug(p1)}">${match}</a>`
    },
    {
      pattern: /(.+?)の統計/g,
      replacement: (match: string, p1: string) => 
        `<a href="/stats/${generateSlug(p1)}">${match}</a>`
    },
  ];
  
  let linkedContent = content;
  linkPatterns.forEach(({ pattern, replacement }) => {
    linkedContent = linkedContent.replace(pattern, replacement);
  });
  
  return linkedContent;
}
```

## コンテンツSEO

### キーワード戦略

#### キーワード密度管理
```typescript
export function analyzeKeywordDensity(content: string, targetKeywords: string[]): KeywordAnalysis {
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  const keywordDensity = targetKeywords.map(keyword => {
    const count = words.filter(word => word.includes(keyword.toLowerCase())).length;
    const density = (count / totalWords) * 100;
    
    return {
      keyword,
      count,
      density,
      status: density > 2 ? 'high' : density > 1 ? 'good' : 'low',
    };
  });
  
  return {
    keywordDensity,
    totalWords,
    recommendations: generateKeywordRecommendations(keywordDensity),
  };
}
```

#### 見出し構造最適化
```typescript
export function optimizeHeadings(content: string): string {
  // H1は1つのみ（記事タイトル）
  const h1Count = (content.match(/^#\s/gm) || []).length;
  if (h1Count > 1) {
    console.warn('H1タグが複数あります。記事内ではH2以下を使用してください。');
  }
  
  // H2-H6の階層構造チェック
  const headings = content.match(/^(#{1,6})\s+(.+)$/gm) || [];
  const headingStructure = headings.map(heading => {
    const level = heading.match(/^(#{1,6})/)?.[1].length || 0;
    const text = heading.replace(/^#{1,6}\s+/, '');
    return { level, text };
  });
  
  // 階層構造の検証
  validateHeadingHierarchy(headingStructure);
  
  return content;
}
```

### コンテンツ品質指標

#### 読みやすさスコア
```typescript
export function calculateReadabilityScore(content: string): ReadabilityScore {
  const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const characters = content.replace(/\s/g, '').length;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgWordLength = characters / words.length;
  
  // 日本語読みやすさ指数（簡易版）
  const readabilityScore = Math.max(0, 100 - (avgSentenceLength * 1.5) - (avgWordLength * 0.5));
  
  return {
    score: Math.round(readabilityScore),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    level: readabilityScore > 70 ? 'easy' : readabilityScore > 50 ? 'medium' : 'hard',
  };
}
```

#### コンテンツ完全性チェック
```typescript
export function checkContentCompleteness(article: BlogArticle): CompletenessCheck {
  const checks = {
    hasIntroduction: /^##\s*概要|^##\s*はじめに|^##\s*導入/.test(article.content),
    hasConclusion: /^##\s*まとめ|^##\s*結論|^##\s*終わりに/.test(article.content),
    hasVisualization: /<ChoroplethMap|<BarChart|<LineChart|<Table/.test(article.content),
    hasDataSource: /データソース|出典|参考/.test(article.content),
    hasInternalLinks: /\[.+?\]\(\/blog\/.+?\)/.test(article.content),
    hasImages: /!\[.*?\]\(.+?\)/.test(article.content),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    checks,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    recommendations: generateCompletenessRecommendations(checks),
  };
}
```

## パフォーマンスSEO

### ページ速度最適化

#### Core Web Vitals対応
```typescript
// LCP (Largest Contentful Paint) 最適化
export function optimizeLCP(article: BlogArticle): LCPOptimization {
  return {
    // ヒーロー画像の最適化
    heroImage: {
      src: `/images/og/${article.slug}.webp`,
      width: 1200,
      height: 630,
      priority: true,
      loading: 'eager',
    },
    // クリティカルCSSのインライン化
    criticalCSS: extractCriticalCSS(article.content),
    // フォントの最適化
    fontOptimization: {
      preload: ['Noto Sans JP', 'Inter'],
      display: 'swap',
    },
  };
}

// CLS (Cumulative Layout Shift) 対策
export function preventCLS(): CLSPrevention {
  return {
    // 画像のアスペクト比指定
    imageAspectRatio: '16/9',
    // 動的コンテンツのプレースホルダー
    skeletonLoaders: true,
    // フォントサイズの固定
    fontSizeStable: true,
  };
}
```

#### リソース最適化
```typescript
export function optimizeResources(article: BlogArticle): ResourceOptimization {
  return {
    // 画像最適化
    images: {
      format: 'webp',
      quality: 80,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      lazy: true,
    },
    // JavaScriptの最適化
    scripts: {
      defer: true,
      async: true,
      minify: true,
    },
    // CSSの最適化
    styles: {
      minify: true,
      critical: true,
      purge: true,
    },
  };
}
```

### モバイル最適化

#### レスポンシブ対応
```typescript
export function ensureMobileOptimization(article: BlogArticle): MobileOptimization {
  return {
    // ビューポート設定
    viewport: 'width=device-width, initial-scale=1.0',
    // タッチフレンドリーなUI
    touchTargets: {
      minSize: 44, // 44px以上
      spacing: 8,  // 8px以上の間隔
    },
    // フォントサイズの調整
    typography: {
      baseSize: '16px',
      scale: 1.25,
      lineHeight: 1.6,
    },
    // ナビゲーションの最適化
    navigation: {
      hamburger: true,
      sticky: true,
      accessible: true,
    },
  };
}
```

## コンテンツマーケティング

### コンテンツカレンダー

#### 季節性を考慮した投稿スケジュール
```typescript
export const contentCalendar = {
  // 年度末・年度初め
  '03-04': {
    themes: ['年度末統計', '新年度分析'],
    keywords: ['年度末', '統計発表', '新年度'],
  },
  // 夏休み期間
  '07-08': {
    themes: ['夏の統計', '観光データ'],
    keywords: ['観光統計', '夏のデータ'],
  },
  // 年末年始
  '12-01': {
    themes: ['年間総括', '来年予測'],
    keywords: ['年間統計', '年次分析'],
  },
};
```

#### トレンドキーワード対応
```typescript
export async function monitorTrendingKeywords(): Promise<TrendingKeyword[]> {
  // Google Trends API連携（実装例）
  const trends = await fetchGoogleTrends(['統計', 'データ分析', '可視化']);
  
  return trends.map(trend => ({
    keyword: trend.keyword,
    interest: trend.interest,
    relatedQueries: trend.relatedQueries,
    contentIdeas: generateContentIdeas(trend),
  }));
}
```

### ソーシャルメディア連携

#### OGP最適化
```typescript
export function generateOGP(article: BlogArticle): OGPData {
  return {
    title: article.title,
    description: article.description,
    image: {
      url: `https://stats47.com/images/og/${article.slug}.png`,
      width: 1200,
      height: 630,
      alt: article.title,
    },
    type: 'article',
    siteName: 'stats47',
    locale: 'ja_JP',
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@stats47',
      creator: '@stats47',
    },
  };
}
```

#### ソーシャルシェア最適化
```typescript
export function optimizeSocialSharing(article: BlogArticle): SocialSharing {
  return {
    // シェア用の短縮URL
    shortUrl: `https://stats47.com/b/${article.slug}`,
    // ハッシュタグ生成
    hashtags: article.tags.map(tag => `#${tag}`).join(' '),
    // シェア用テキスト
    shareText: `${article.title} - ${article.description}`,
    // シェアボタン配置
    shareButtons: ['twitter', 'facebook', 'linkedin', 'hatena'],
  };
}
```

## 分析・測定

### SEO指標監視

#### 検索パフォーマンス
```typescript
export interface SEOMetrics {
  // 検索順位
  rankings: {
    keyword: string;
    position: number;
    url: string;
    date: string;
  }[];
  // クリック率
  ctr: {
    keyword: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  // 表示回数
  impressions: {
    keyword: string;
    count: number;
    date: string;
  }[];
}
```

#### コンテンツパフォーマンス
```typescript
export interface ContentMetrics {
  // ページビュー
  pageViews: {
    url: string;
    views: number;
    uniqueViews: number;
    date: string;
  }[];
  // 滞在時間
  engagement: {
    url: string;
    avgTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
  }[];
  // 内部リンク
  internalLinks: {
    from: string;
    to: string;
    clicks: number;
  }[];
}
```

### レポート生成

#### 月次SEOレポート
```typescript
export async function generateMonthlySEOReport(month: string): Promise<SEOReport> {
  const metrics = await getSEOMetrics(month);
  
  return {
    period: month,
    summary: {
      totalPageViews: metrics.pageViews.reduce((sum, pv) => sum + pv.views, 0),
      avgRanking: calculateAverageRanking(metrics.rankings),
      topKeywords: getTopKeywords(metrics.rankings),
      improvementAreas: identifyImprovementAreas(metrics),
    },
    recommendations: generateSEORecommendations(metrics),
    nextMonthGoals: setNextMonthGoals(metrics),
  };
}
```

## 継続的改善

### A/Bテスト

#### タイトル最適化テスト
```typescript
export function createTitleVariants(article: BlogArticle): TitleVariant[] {
  return [
    {
      variant: 'A',
      title: article.title,
      description: 'オリジナルタイトル',
    },
    {
      variant: 'B',
      title: `${article.title}【${new Date().getFullYear()}年最新】`,
      description: '年数強調版',
    },
    {
      variant: 'C',
      title: `データで見る${article.title}`,
      description: 'データ強調版',
    },
  ];
}
```

#### メタディスクリプション最適化
```typescript
export function createDescriptionVariants(article: BlogArticle): DescriptionVariant[] {
  return [
    {
      variant: 'A',
      description: article.description,
      focus: 'standard',
    },
    {
      variant: 'B',
      description: `${article.description} 詳細な分析と可視化で解説。`,
      focus: 'analysis',
    },
    {
      variant: 'C',
      description: `${article.description} 無料で閲覧可能。`,
      focus: 'free',
    },
  ];
}
```

### 競合分析

#### 競合サイト監視
```typescript
export async function analyzeCompetitors(): Promise<CompetitorAnalysis> {
  const competitors = [
    'toukei-labo.com',
    'data.go.jp',
    'e-stat.go.jp',
  ];
  
  const analysis = await Promise.all(
    competitors.map(async (domain) => ({
      domain,
      keywords: await getCompetitorKeywords(domain),
      content: await analyzeCompetitorContent(domain),
      backlinks: await getCompetitorBacklinks(domain),
    }))
  );
  
  return {
    competitors: analysis,
    opportunities: identifyContentOpportunities(analysis),
    threats: identifyCompetitiveThreats(analysis),
  };
}
```
