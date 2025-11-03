/**
 * MDXコンテンツレンダリングコンポーネント
 *
 * next-mdx-remoteを使用してMDXコンテンツをレンダリングする
 * Server Componentsで使用可能
 */

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ArticleContextProvider } from "../contexts/ArticleContext";

// カスタムMDXコンポーネントをインポート
import { PrefectureRankingHighlights } from "./mdx-components/PrefectureRankingHighlights";
import { PrefectureRankingMap } from "./mdx-components/PrefectureRankingMap";
import { PrefectureRankingRegion } from "./mdx-components/PrefectureRankingRegion";
import { PrefectureRankingTable } from "./mdx-components/PrefectureRankingTable";
import { PrefectureStatisticsCard } from "./mdx-components/PrefectureStatisticsCard";

import type { Article } from "../types/article.types";

/**
 * MDXコンポーネントのマッピング
 */
const mdxComponents = {
  // カスタムコンポーネント
  PrefectureRankingMap,
  PrefectureRankingTable,
  PrefectureRankingHighlights,
  PrefectureRankingRegion,
  PrefectureStatisticsCard,
  // 標準的なHTML要素のスタイリングも追加可能
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-4 mt-8 text-3xl font-bold" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-3 mt-6 text-2xl font-bold" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-2 mt-4 text-xl font-semibold" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mb-2 mt-3 text-lg font-semibold" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 ml-6 list-disc" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 ml-6 list-decimal" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-2" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="mb-4 border-l-4 border-primary/50 pl-4 italic"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    const { className, ...rest } = props;
    const isInline = !className?.includes("language-");

    return isInline ? (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        {...rest}
      />
    ) : (
      <code className={className} {...rest} />
    );
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-primary underline-offset-4 hover:underline" {...props} />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-border" {...props} />
  ),
};

/**
 * MDXコンテンツのプロパティ
 */
export interface MDXContentProps {
  /** 記事データ */
  article: Article;
  /** CSSクラス名 */
  className?: string;
}

/**
 * MDXコンテンツレンダリングコンポーネント
 *
 * ArticleContextProviderでラップして、カスタムコンポーネントから
 * 記事のメタデータにアクセスできるようにする
 */
export function MDXContent({ article, className }: MDXContentProps) {
  // コンテキストの値を準備
  const contextValue = {
    frontmatter: article.frontmatter,
    category: article.actualCategory,
    year: article.time,
  };

  // カスタムコンポーネントにコンテキスト値を渡すためにラッパーを作成
  // 各カスタムコンポーネントをArticleContextProviderでラップ
  const componentsWithContext = {
    ...mdxComponents,
    // カスタムコンポーネントをラップしてコンテキストを提供
    PrefectureRankingMap: (
      props: React.ComponentProps<typeof PrefectureRankingMap>
    ) => (
      <ArticleContextProvider value={contextValue}>
        <PrefectureRankingMap {...props} />
      </ArticleContextProvider>
    ),
    PrefectureRankingTable: (
      props: React.ComponentProps<typeof PrefectureRankingTable>
    ) => (
      <ArticleContextProvider value={contextValue}>
        <PrefectureRankingTable {...props} />
      </ArticleContextProvider>
    ),
    PrefectureRankingHighlights: (
      props: React.ComponentProps<typeof PrefectureRankingHighlights>
    ) => (
      <ArticleContextProvider value={contextValue}>
        <PrefectureRankingHighlights {...props} />
      </ArticleContextProvider>
    ),
    PrefectureRankingRegion: (
      props: React.ComponentProps<typeof PrefectureRankingRegion>
    ) => (
      <ArticleContextProvider value={contextValue}>
        <PrefectureRankingRegion {...props} />
      </ArticleContextProvider>
    ),
    PrefectureStatisticsCard: (
      props: React.ComponentProps<typeof PrefectureStatisticsCard>
    ) => (
      <ArticleContextProvider value={contextValue}>
        <PrefectureStatisticsCard {...props} />
      </ArticleContextProvider>
    ),
  };

  return (
    <ArticleContextProvider value={contextValue}>
      <div className={className}>
        <MDXRemote
          source={article.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeHighlight,
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap" }],
              ],
            },
          }}
          components={componentsWithContext}
        />
      </div>
    </ArticleContextProvider>
  );
}
