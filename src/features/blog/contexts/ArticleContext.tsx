/**
 * 記事コンテキスト
 * 
 * MDXコンテンツ内で使用されるコンポーネントから
 * 記事のメタデータ（statsDataId、chartSettings等）にアクセスできるようにする
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ArticleFrontmatter } from "../types/article.types";

/**
 * 記事コンテキストの型
 */
interface ArticleContextValue {
  /** 記事のFrontmatter */
  frontmatter: ArticleFrontmatter;
  /** 統計データID */
  statsDataId?: string;
  /** チャート設定 */
  chartSettings?: ArticleFrontmatter["chartSettings"];
  /** カテゴリ */
  category: string;
  /** 年度 */
  year?: string;
}

/**
 * 記事コンテキスト
 */
const ArticleContext = createContext<ArticleContextValue | null>(null);

/**
 * 記事コンテキストプロバイダー
 */
export function ArticleContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ArticleContextValue;
}) {
  return (
    <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>
  );
}

/**
 * 記事コンテキストを使用するカスタムフック
 * 
 * @returns 記事コンテキストの値
 * @throws {Error} コンテキスト外で使用された場合
 */
export function useArticleContext(): ArticleContextValue {
  const context = useContext(ArticleContext);

  if (!context) {
    throw new Error(
      "useArticleContext must be used within ArticleContextProvider"
    );
  }

  return context;
}

