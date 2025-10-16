# エンゲージメント機能ガイド

## 概要

Next.js 15とTailwind CSSを利用したブログサイトで、効果的なエンゲージメント機能を実装する方法について解説します。関連記事表示とコメントシステムの実装に焦点を当て、ユーザーの滞在時間を延ばし、サイトのエンゲージメントを向上させる方法を紹介します。

## 1. 関連記事表示の実装

### 1.1 関連記事の基本的な実装アプローチ

関連記事を表示するための主なアプローチは以下の通りです：

1. **タグ/カテゴリベース**: 同じタグやカテゴリを持つ記事を関連記事として表示
2. **キーワードマッチング**: タイトルや内容のキーワードが一致する記事を表示
3. **日付ベース**: 最新または同時期の記事を表示
4. **人気記事**: アクセス数や「いいね」の多い記事を表示
5. **機械学習**: コンテンツの類似性や読者の行動パターンから関連性を計算

### 1.2 データモデルの設計

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

### 1.3 タグベースの関連記事を取得する関数

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

### 1.4 記事コンテンツの類似性に基づく関連記事

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

### 1.5 サーバーコンポーネントでの関連記事表示

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

### 1.6 ブログ記事詳細ページでの実装

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

### 1.7 関連記事表示のUIバリエーション

#### カード形式の表示

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

#### 水平スクロール形式

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

## 2. コメントシステムの実装

### 2.1 コメントシステムの実装アプローチ

コメントシステムを実装するには、いくつかのアプローチがあり、それぞれに長所と短所があります。

#### 2.1.1 サードパーティサービスの利用

最も簡単な実装方法は、既存のコメントサービスを利用することです。

##### Disqus

```tsx
// components/comments/DisqusComments.tsx
import { DiscussionEmbed } from 'disqus-react';

type DisqusCommentsProps = {
  postId: string;
  postTitle: string;
  postUrl: string;
};

export default function DisqusComments({ postId, postTitle, postUrl }: DisqusCommentsProps) {
  const disqusShortname = 'YOUR_DISQUS_SHORTNAME'; // Disqusで取得したショートネーム

  const disqusConfig = {
    url: postUrl,
    identifier: postId,
    title: postTitle,
  };

  return (
    <div className="mt-10 py-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6">コメント</h3>
      <DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
    </div>
  );
}
```

##### Giscus (GitHub Discussionsベース)

GitHubアカウントでコメントできるシステムです。

```tsx
// components/comments/GiscusComments.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function GiscusComments() {
  const commentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!commentContainerRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.setAttribute('data-repo', 'yourusername/yourrepo');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('crossorigin', 'anonymous');
    
    commentContainerRef.current.appendChild(script);
    
    return () => {
      if (commentContainerRef.current) {
        script.remove();
      }
    };
  }, []);

  return (
    <div className="mt-10 py-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6">コメント</h3>
      <div ref={commentContainerRef}></div>
    </div>
  );
}
```

### 2.2 Supabaseを使用した独自コメントシステム

Supabaseは、Firebase代替のオープンソースバックエンドサービスで、認証やデータベース機能を提供します。

#### 2.2.1 Supabaseのセットアップ

1. [Supabase](https://supabase.io/)でアカウントを作成し、新しいプロジェクトを作成
2. 必要なパッケージをインストール

```bash
npm install @supabase/supabase-js
```

3. Supabase設定ファイルを作成

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. テーブルスキーマを設定

Supabaseダッシュボードで以下のSQLを実行してコメントテーブルを作成：

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_slug VARCHAR NOT NULL,
  author_name VARCHAR NOT NULL,
  author_email VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON comments 
FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
```

#### 2.2.2 APIルートの実装

Next.js 15のApp Routerを使用してAPIルートを作成します：

```typescript
// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// コメントの取得
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Post slug is required' },
      { status: 400 }
    );
  }
  
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });
    
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ comments: data });
}

// コメントの投稿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_slug, author_name, author_email, content } = body;
    
    if (!post_slug || !author_name || !author_email || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert([
        { post_slug, author_name, author_email, content }
      ])
      .select();
      
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Comment added successfully', comment: data[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
```

#### 2.2.3 コメントコンポーネントの実装

```tsx
// components/comments/CommentSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

type Comment = {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
};

type CommentFormData = {
  author_name: string;
  author_email: string;
  content: string;
};

export default function CommentSection({ postSlug }: { postSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<CommentFormData>();
  
  // コメントの取得
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comments?slug=${postSlug}`);
        const data = await response.json();
        
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [postSlug]);
  
  // コメントの投稿
  const onSubmit = async (data: CommentFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_slug: postSlug,
          author_name: data.author_name,
          author_email: data.author_email,
          content: data.content,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.comment) {
        setComments([...comments, result.comment]);
        reset(); // フォームをリセット
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mt-10 py-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6">コメント</h3>
      
      {/* コメント一覧 */}
      <div className="mb-8">
        {isLoading ? (
          <p className="text-gray-500">コメントを読み込み中...</p>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{comment.author_name}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">まだコメントがありません。最初のコメントを投稿しましょう！</p>
        )}
      </div>
      
      {/* コメント投稿フォーム */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">コメントを投稿する</h4>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 mb-1">
              お名前 *
            </label>
            <input
              id="author_name"
              type="text"
              {...register('author_name', { required: 'お名前は必須です' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.author_name && (
              <p className="text-red-500 text-sm mt-1">{errors.author_name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="author_email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス *
            </label>
            <input
              id="author_email"
              type="email"
              {...register('author_email', { 
                required: 'メールアドレスは必須です',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '有効なメールアドレスを入力してください'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.author_email && (
              <p className="text-red-500 text-sm mt-1">{errors.author_email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              コメント *
            </label>
            <textarea
              id="content"
              rows={4}
              {...register('content', { required: 'コメントは必須です' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '投稿中...' : 'コメントを投稿'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 3. A/Bテストの実装

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

## 4. パフォーマンスの最適化

エンゲージメント機能を高速化するための最適化ポイント：

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

Next.js 15とTailwind CSSを使用したブログサイトにおけるエンゲージメント機能の実装について、様々なアプローチを紹介しました。最も効果的な実装方法は以下の要素を組み合わせたものです：

1. **タグベースのマッチング**: 同じタグを持つ記事を表示する基本的な手法
2. **コンテンツの類似性分析**: 記事の内容やキーワードから関連度を計算
3. **リーダーの行動データ活用**: 閲覧パターンやエンゲージメントを参考にした推薦
4. **A/Bテスト**: 異なる表示形式をテストして最適なUIを見つける
5. **パフォーマンス最適化**: キャッシング、ISR、遅延読み込みを活用

これらのテクニックを組み合わせることで、ユーザーエンゲージメントを高め、サイト滞在時間を延ばす効果的なエンゲージメント機能を実現できます。

## 関連ドキュメント

- [パフォーマンス最適化ガイド](./08_パフォーマンス最適化ガイド.md)
- [SEOガイド](./05_SEOガイド.md)
- [スタイリングガイド](./03_スタイリングガイド.md)

---

**作成日**: 2024年10月14日  
**最終更新日**: 2024年10月14日  
**バージョン**: 1.0
