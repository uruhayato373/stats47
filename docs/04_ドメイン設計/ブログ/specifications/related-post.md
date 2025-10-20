---
title: 関連記事表示の実装方法
created: 2025-10-14
updated: 2025-10-16
tags:
  - domain/blog
  - specifications
---

# 関連記事表示の実装方法

Next.js 15とTailwind CSSを利用したブログサイトで、効果的な関連記事表示を実装する方法を解説します。関連記事機能は読者のエンゲージメントを高め、滞在時間を延ばすための重要な要素です。

## 1. 関連記事の基本的な実装アプローチ

関連記事を表示するための主なアプローチは以下の通りです：

1. **タグ/カテゴリベース**: 同じタグやカテゴリを持つ記事を関連記事として表示
2. **キーワードマッチング**: タイトルや内容のキーワードが一致する記事を表示
3. **日付ベース**: 最新または同時期の記事を表示
4. **人気記事**: アクセス数や「いいね」の多い記事を表示
5. **機械学習**: コンテンツの類似性や読者の行動パターンから関連性を計算

## 2. データモデルの設計

関連記事を実装するには、まず適切なデータモデルを設計します：

```typescript
// types/post.ts
export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  date: string;
  author: {
    name: string;
    picture: string;
  };
  tags: string[];
  category: string;
  viewCount?: number;
};
```

## 3. タグベースの関連記事を取得する関数

タグに基づいて関連記事を取得する関数の例：

```typescript
// lib/api.ts
import 'server-only';
import { Post } from '@/types/post';

// 現在の記事と同じタグを持つ関連記事を取得
export async function getRelatedPosts(
  currentPost: Post,
  limit: number = 3
): Promise<Post[]> {
  // すべての記事を取得
  const allPosts = await getAllPosts();
  
  // 現在の記事を除外し、タグの一致度でソート
  return allPosts
    .filter(post => post.id !== currentPost.id) // 現在の記事を除外
    .map(post => {
      // 共通するタグの数を計算
      const commonTags = post.tags.filter(tag => 
        currentPost.tags.includes(tag)
      );
      
      return {
        ...post,
        relevanceScore: commonTags.length // タグの一致度をスコアとして追加
      };
    })
    .filter(post => post.relevanceScore > 0) // 少なくとも1つのタグが一致する記事のみ
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // スコアの高い順にソート
    .slice(0, limit); // 指定された数の記事を取得
}

// すべての記事を取得（例：APIやデータベースから）
export async function getAllPosts(): Promise<Post[]> {
  // 実際のプロジェクトでは、APIやデータベースから記事を取得
  // 例えば、CMSからの取得：
  // const res = await fetch('https://your-cms-api/posts');
  // return await res.json();
  
  // または、ファイルベースのデータ：
  // return await import('@/data/posts.json').then(m => m.default);
  
  // この例ではモックデータを返す
  return mockPosts;
}

// モックデータ（実際の実装では削除）
const mockPosts: Post[] = [
  // モック記事データ
];
```

## 4. 記事コンテンツの類似性に基づく関連記事

より高度な実装では、コンテンツの類似性を分析して関連記事を取得できます：

```typescript
// lib/api.ts
import { Post } from '@/types/post';
import natural from 'natural'; // 自然言語処理ライブラリ

// TF-IDFベクトライザー
const TfIdf = natural.TfIdf;

// コンテンツの類似性に基づいて関連記事を取得
export async function getSimilarPosts(
  currentPost: Post,
  limit: number = 3
): Promise<Post[]> {
  const allPosts = await getAllPosts();
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);
  
  // TF-IDFの初期化
  const tfidf = new TfIdf();
  
  // すべての記事をドキュメントとして追加
  otherPosts.forEach((post, index) => {
    tfidf.addDocument(`${post.title} ${post.excerpt} ${post.content}`);
  });
  
  // 現在の記事のテキスト
  const currentPostText = `${currentPost.title} ${currentPost.excerpt} ${currentPost.content}`;
  
  // 各記事の類似度スコアを計算
  const scores = otherPosts.map((post, index) => {
    let score = 0;
    tfidf.tfidfs(currentPostText, (i, measure) => {
      if (i === index) {
        score = measure;
      }
    });
    
    return {
      ...post,
      similarityScore: score
    };
  });
  
  // スコアでソートして上位を返す
  return scores
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}
```

## 5. サーバーコンポーネントでの関連記事表示

Next.js 15のApp Routerを使用して関連記事を表示するサーバーコンポーネント：

```tsx
// components/RelatedPosts.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/types/post';

type RelatedPostsProps = {
  posts: Post[];
  title?: string;
};

export default function RelatedPosts({ posts, title = "関連記事" }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }
  
  return (
    <section className="mt-12 mb-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <article key={post.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/blog/${post.slug}`}>
              <div className="relative w-full h-40">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(min-width: 640px) 50vw, (min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold line-clamp-2 mb-2">{post.title}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span>{new Date(post.date).toLocaleDateString('ja-JP')}</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
```

## 6. ブログ記事詳細ページでの実装

```tsx
// app/blog/[slug]/page.tsx
import { getPostBySlug, getRelatedPosts } from '@/lib/api';
import RelatedPosts from '@/components/RelatedPosts';
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  // 関連記事を取得（タグベース）
  const relatedPosts = await getRelatedPosts(post, 3);
  
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* 記事のメインコンテンツ */}
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      
      {/* 記事の内容 */}
      <div className="prose max-w-none mt-8">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      
      {/* 関連記事セクション */}
      {relatedPosts.length > 0 && (
        <RelatedPosts posts={relatedPosts} />
      )}
    </article>
  );
}
```

## 7. ISRを使った最適化

関連記事を含むページのパフォーマンスを最適化するためにISR（Incremental Static Regeneration）を活用：

```tsx
// app/blog/[slug]/page.tsx
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/lib/api';
import RelatedPosts from '@/components/RelatedPosts';
import { notFound } from 'next/navigation';

// ISRの設定（1時間ごとに再生成）
export const revalidate = 3600;

// 静的に生成するパスを指定
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  // 関連記事を取得
  const relatedPosts = await getRelatedPosts(post, 3);
  
  return (
    // コンポーネントの内容
  );
}
```

## 8. アナリティクスによる読者の行動トラッキング

より高度な関連記事表示のためには、読者の行動データを分析することも有効です：

```tsx
// components/PostAnalytics.tsx
'use client';

import { useEffect } from 'react';
import { Post } from '@/types/post';

type PostAnalyticsProps = {
  post: Post;
};

export default function PostAnalytics({ post }: PostAnalyticsProps) {
  useEffect(() => {
    // 記事の閲覧をトラッキング
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            slug: post.slug,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };
    
    trackPageView();
  }, [post.id, post.slug]);
  
  return null; // 何もレンダリングしない
}
```

対応するAPIルート：

```tsx
// app/api/analytics/page-view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const { postId, slug, timestamp } = await request.json();
    
    // データベースに閲覧数を記録
    await incrementViewCount(postId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}
```

## 9. 協調フィルタリングの実装

読者の行動パターンに基づいた協調フィルタリングの例：

```typescript
// lib/recommendations.ts
type UserBehavior = {
  userId: string;
  postId: string;
  action: 'view' | 'like' | 'comment' | 'share';
  timestamp: string;
};

// 協調フィルタリングによる推薦
export async function getRecommendationsByUserBehavior(
  currentPostId: string,
  userId?: string,
  limit: number = 3
): Promise<Post[]> {
  // ユーザーIDがない場合は一般的な人気記事を返す
  if (!userId) {
    return getPopularPosts(limit);
  }
  
  // ユーザーの行動履歴を取得
  const userBehaviors = await getUserBehaviors(userId);
  
  // 類似ユーザーを見つける
  const similarUsers = await findSimilarUsers(userId, userBehaviors);
  
  // 類似ユーザーが閲覧した記事を集計
  const recommendedPostIds = getSimilarUsersPosts(similarUsers, currentPostId);
  
  // 推薦される記事を取得
  const recommendedPosts = await getPostsByIds(recommendedPostIds);
  
  return recommendedPosts.slice(0, limit);
}

// 他の関数（実際の実装では、データベースやAPIから取得）
async function getUserBehaviors(userId: string): Promise<UserBehavior[]> {
  // データベースからユーザーの行動履歴を取得
  return [];
}

async function findSimilarUsers(userId: string, behaviors: UserBehavior[]): Promise<string[]> {
  // 類似したユーザーを検索するロジック
  return [];
}

function getSimilarUsersPosts(similarUsers: string[], excludePostId: string): string[] {
  // 類似ユーザーが閲覧した記事を集計
  return [];
}

async function getPostsByIds(postIds: string[]): Promise<Post[]> {
  // 指定されたIDの記事を取得
  return [];
}

async function getPopularPosts(limit: number): Promise<Post[]> {
  // 人気記事を取得
  return [];
}
```

## 10. 関連記事表示のUIバリエーション

### 10.1 カード形式の表示

```tsx
// components/RelatedPostCards.tsx
export default function RelatedPostCards({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <article key={post.id} className="border rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
          {/* カード内容 */}
        </article>
      ))}
    </div>
  );
}
```

### 10.2 水平スクロール形式

```tsx
// components/RelatedPostsSlider.tsx
'use client';

import { useRef } from 'react';
import { Post } from '@/types/post';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RelatedPostsSlider({ posts }: { posts: Post[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' 
        ? -current.offsetWidth * 0.8 
        : current.offsetWidth * 0.8;
      
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow"
        aria-label="前へ"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 py-4"
      >
        {posts.map(post => (
          <div 
            key={post.id} 
            className="flex-none w-80 snap-start"
          >
            <Link href={`/blog/${post.slug}`}>
              <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="relative h-48 w-full">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{post.excerpt}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow"
        aria-label="次へ"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
```

### 10.3 サイドバー形式

```tsx
// components/RelatedPostsSidebar.tsx
export default function RelatedPostsSidebar({ posts }: { posts: Post[] }) {
  return (
    <aside className="border rounded-lg p-6 bg-gray-50">
      <h2 className="text-xl font-bold mb-4">関連記事</h2>
      
      <div className="space-y-4">
        {posts.map(post => (
          <article key={post.id} className="flex items-start space-x-3">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover rounded"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium line-clamp-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(post.date).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
```

## 11. A/Bテストの実装

関連記事表示の効果をテストするためのA/Bテスト実装例：

```tsx
// components/ABTestRelatedPosts.tsx
'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import RelatedPostCards from './RelatedPostCards';
import RelatedPostsSlider from './RelatedPostsSlider';
import RelatedPostsSidebar from './RelatedPostsSidebar';

type ABTestRelatedPostsProps = {
  posts: Post[];
};

// A/Bテストのバリエーション
type TestVariant = 'cards' | 'slider' | 'sidebar';

export default function ABTestRelatedPosts({ posts }: ABTestRelatedPostsProps) {
  const [variant, setVariant] = useState<TestVariant>('cards');
  
  useEffect(() => {
    // ユーザーIDまたはセッションIDの取得
    const userId = getUserId();
    
    // IDに基づいてバリエーションを決定（均等に分散）
    const variantIndex = hashString(userId) % 3;
    const variants: TestVariant[] = ['cards', 'slider', 'sidebar'];
    setVariant(variants[variantIndex]);
    
    // インプレッションをトラッキング
    trackImpression(userId, variants[variantIndex]);
  }, []);
  
  // クリックをトラッキングする関数
  const trackClick = (postId: string) => {
    const userId = getUserId();
    
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        variant,
        action: 'click',
        postId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  };
  
  // バリエーションごとに異なるコンポーネントをレンダリング
  if (variant === 'slider') {
    return <RelatedPostsSlider posts={posts} />;
  }
  
  if (variant === 'sidebar') {
    return <RelatedPostsSidebar posts={posts} />;
  }
  
  return <RelatedPostCards posts={posts} />;
}

// ヘルパー関数
function getUserId(): string {
  // localStorage、cookie、または匿名IDからユーザーを識別
  let userId = localStorage.getItem('user_id');
  
  if (!userId) {
    userId = `anonymous_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_id', userId);
  }
  
  return userId;
}

function trackImpression(userId: string, variant: string): void {
  fetch('/api/analytics/ab-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      variant,
      action: 'impression',
      timestamp: new Date().toISOString(),
    }),
  }).catch(console.error);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

## 12. パフォーマンスの最適化

関連記事表示を高速化するための最適化ポイント：

1. **キャッシング**: 関連記事の計算結果をキャッシュ
2. **レイジーローディング**: 関連記事セクションを遅延読み込み
3. **画像最適化**: Next.jsの`Image`コンポーネントでWebPなどの最適化された形式を使用
4. **先読み**: 関連記事のページを事前にprefetch

```tsx
// components/OptimizedRelatedPosts.tsx
'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import Link from 'next/link';
import Image from 'next/image';

export default function OptimizedRelatedPosts({ postId }: { postId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 関連記事を非同期で読み込み
    const fetchRelatedPosts = async () => {
      try {
        const res = await fetch(`/api/related-posts/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch related posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedPosts();
  }, [postId]);
  
  // 関連記事をprefetch
  useEffect(() => {
    if (posts.length > 0) {
      posts.forEach(post => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/blog/${post.slug}`;
        document.head.appendChild(link);
      });
    }
  }, [posts]);
  
  if (loading) {
    return <div className="animate-pulse">{/* スケルトンローディング */}</div>;
  }
  
  if (posts.length === 0) {
    return null;
  }
  
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">関連記事</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <article key={post.id} className="border rounded-lg overflow-hidden shadow-sm">
            <Link href={`/blog/${post.slug}`}>
              {/* 画像とコンテンツ */}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
```

## まとめ

Next.js 15とTailwind CSSを使用したブログサイトにおける関連記事表示の実装について、様々なアプローチを紹介しました。最も効果的な実装方法は以下の要素を組み合わせたものです：

1. **タグベースのマッチング**: 同じタグを持つ記事を表示する基本的な手法
2. **コンテンツの類似性分析**: 記事の内容やキーワードから関連度を計算
3. **リーダーの行動データ活用**: 閲覧パターンやエンゲージメントを参考にした推薦
4. **A/Bテスト**: 異なる表示形式をテストして最適なUIを見つける
5. **パフォーマンス最適化**: キャッシング、ISR、遅延読み込みを活用

これらのテクニックを組み合わせることで、ユーザーエンゲージメントを高め、サイト滞在時間を延ばす効果的な関連記事表示を実現できます。
