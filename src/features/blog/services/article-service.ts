/**
 * 記事サービス
 *
 * ビジネスロジック層：記事取得、一覧取得、データ変換を担当
 */

import {
  getArticleFromDB,
  listArticlesFromDB,
  countArticlesFromDB,
} from "../repositories/article-db-repository";
import { listMDXFiles, readMDXFile } from "../repositories/article-repository";

import type {
  Article,
  ArticleFilter,
  ArticleListResponse,
  ArticleSortOrder,
} from "../types/article.types";

/**
 * 警告ログを出力するかどうかを判定
 * production環境やビルド時には警告を出力しない
 */
function shouldLogWarning(): boolean {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
  // production環境では警告を出力しない
  if (env === "production") {
    return false;
  }
  // ビルド時（NEXT_PHASEが設定されている場合）も警告を出力しない
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return false;
  }
  return true;
}

/**
 * 抜粋を生成（最初の160文字）
 *
 * @param content - MDXコンテンツ
 * @returns 抜粋テキスト
 */
function generateExcerpt(content: string): string {
  // マークダウン記号を除去してプレーンテキストに変換
  const plainText = content
    .replace(/^#+\s+/gm, "") // 見出し記号を除去
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // リンクをテキストに変換
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 太字記号を除去
    .replace(/\*([^*]+)\*/g, "$1") // 斜体記号を除去
    .replace(/`([^`]+)`/g, "$1") // インラインコードを除去
    .replace(/\n+/g, " ") // 改行をスペースに変換
    .trim();

  if (plainText.length <= 160) {
    return plainText;
  }

  // 160文字で切り捨て、最後の単語が途切れないように調整
  const truncated = plainText.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.slice(0, lastSpace) + "..."
    : truncated + "...";
}

/**
 * 読了時間を計算（300語/分）
 *
 * @param content - MDXコンテンツ
 * @returns 読了時間（分）
 */
function calculateReadingTime(content: string): number {
  // マークダウン記号を除去してプレーンテキストに変換
  const plainText = content
    .replace(/^#+\s+/gm, "") // 見出し記号を除去
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // リンクをテキストに変換
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 太字記号を除去
    .replace(/\*([^*]+)\*(?!\*)/g, "$1") // 斜体記号を除去（太字でない場合）
    .replace(/`([^`]+)`/g, "$1") // インラインコードを除去
    .replace(/\n+/g, " ") // 改行をスペースに変換
    .trim();

  // 日本語と英語の語数を計算（日本語は文字数、英語は単語数）
  const japaneseChars = (
    plainText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []
  ).length;
  const englishWords = plainText
    .replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // 日本語は1文字=0.5語、英語は1単語=1語として計算
  const totalWords = japaneseChars * 0.5 + englishWords;

  // 300語/分で計算し、最低1分
  return Math.max(1, Math.ceil(totalWords / 300));
}

/**
 * 記事一覧をソート
 *
 * @param articles - ソート対象の記事配列
 * @param order - ソート順
 * @returns ソート済みの記事配列
 */
function sortArticles(articles: Article[], order: ArticleSortOrder): Article[] {
  const sorted = [...articles];

  switch (order) {
    case "date-desc":
      // dateが削除されたため、timeでソート（降順）
      sorted.sort((a, b) => {
        const timeA = a.time ? parseInt(a.time, 10) : 0;
        const timeB = b.time ? parseInt(b.time, 10) : 0;
        return timeB - timeA;
      });
      break;

    case "date-asc":
      // dateが削除されたため、timeでソート（昇順）
      sorted.sort((a, b) => {
        const timeA = a.time ? parseInt(a.time, 10) : 0;
        const timeB = b.time ? parseInt(b.time, 10) : 0;
        return timeA - timeB;
      });
      break;

    case "title-asc":
      sorted.sort((a, b) => {
        return a.frontmatter.title.localeCompare(b.frontmatter.title, "ja");
      });
      break;
  }

  return sorted;
}

/**
 * 記事一覧をフィルタリング
 *
 * @param articles - フィルタ対象の記事配列
 * @param filter - フィルタ条件
 * @returns フィルタ済みの記事配列
 */
function filterArticles(articles: Article[], filter: ArticleFilter): Article[] {
  let filtered = [...articles];

  // カテゴリでフィルタ
  if (filter.category) {
    filtered = filtered.filter(
      (article) => article.actualCategory === filter.category
    );
  }

  // タグでフィルタ（すべてのタグが含まれている必要がある）
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter((article) => {
      return filter.tags!.every((tag) =>
        article.frontmatter.tags.includes(tag)
      );
    });
  }

  // 時間でフィルタ
  if (filter.time) {
    filtered = filtered.filter((article) => article.time === filter.time);
  }

  return filtered;
}

/**
 * スラッグと年度から記事を取得
 *
 * データベース優先で読み込み、見つからない場合はファイルから読み込みます。
 *
 * @param category - カテゴリ（ディレクトリ名。見つからない場合は全カテゴリから検索）
 * @param slug - スラッグ
 * @param year - 年度
 * @returns 記事データ
 * @throws {Error} ファイルが存在しない場合
 */
export async function getArticleBySlug(
  category: string,
  slug: string,
  year: string
): Promise<Article> {
  // まずデータベースから取得を試みる
  try {
    const articleFromDB = await getArticleFromDB(category, slug, year);
    if (articleFromDB) {
      // コンテンツはファイルから読み込む必要がある
      try {
        const articleFromFile = await readMDXFile(category, slug, year);
        articleFromDB.content = articleFromFile.content;
        // descriptionがない場合は抜粋を生成してfrontmatter.descriptionに設定
        if (!articleFromDB.frontmatter.description) {
          articleFromDB.frontmatter.description = generateExcerpt(
            articleFromDB.content
          );
        }
        articleFromDB.readingTime = calculateReadingTime(articleFromDB.content);
      } catch (fileError) {
        // ファイルが見つからない場合はデータベースのデータを使用
        if (shouldLogWarning()) {
          console.warn(
            `ファイルが見つかりませんが、データベースから取得しました: ${category}/${slug}/${year}.mdx`
          );
        }
      }
      return articleFromDB;
    }
  } catch (dbError) {
    // データベースからの取得に失敗した場合は、ファイルから読み込む
    if (shouldLogWarning()) {
      console.warn(
        `データベースからの取得に失敗、ファイルから読み込みます:`,
        dbError instanceof Error ? dbError.message : String(dbError)
      );
    }
  }

  // データベースにない場合はファイルから読み込み
  try {
    const article = await readMDXFile(category, slug, year);
    // descriptionがない場合は抜粋を生成してfrontmatter.descriptionに設定
    if (!article.frontmatter.description) {
      article.frontmatter.description = generateExcerpt(article.content);
    }
    article.readingTime = calculateReadingTime(article.content);
    return article;
  } catch (error) {
    // 指定されたカテゴリで見つからない場合、全カテゴリから検索
    const filePaths = await listMDXFiles();
    const matchingFile = filePaths.find(
      (fp) => fp.slug === slug && fp.year === year
    );

    if (matchingFile) {
      const article = await readMDXFile(
        matchingFile.category,
        matchingFile.slug,
        matchingFile.year
      );
      // descriptionがない場合は抜粋を生成してfrontmatter.descriptionに設定
      if (!article.frontmatter.description) {
        article.frontmatter.description = generateExcerpt(article.content);
      }
      article.readingTime = calculateReadingTime(article.content);
      return article;
    }

    // 見つからない場合は元のエラーを再スロー
    throw error;
  }
}

/**
 * 記事一覧を取得
 *
 * データベース優先で読み込み、データベースにデータがない場合はファイルから読み込みます。
 *
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事一覧レスポンス
 */
export async function listArticles(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<ArticleListResponse> {
  // まずデータベースから取得を試みる
  try {
    const articlesFromDB = await listArticlesFromDB(filter, sortOrder);
    const totalFromDB = await countArticlesFromDB(filter);

    // データベースにデータがある場合は、コンテンツをファイルから読み込む
    if (articlesFromDB.length > 0) {
      const articlesWithContent: Article[] = [];

      for (const article of articlesFromDB) {
        try {
          const articleFromFile = await readMDXFile(
            article.actualCategory,
            article.slug,
            article.time || ""
          );
          article.content = articleFromFile.content;
        } catch (fileError) {
          // ファイルが見つからない場合は空コンテンツのまま
          if (shouldLogWarning()) {
            console.warn(
              `ファイルが見つかりませんが、データベースから取得しました: ${article.actualCategory}/${article.slug}/${article.time}.mdx`
            );
          }
        }
        articlesWithContent.push(article);
      }

      // ページネーション処理
      const limit = filter.limit || 10;
      const offset = filter.offset || 0;
      const paginated = articlesWithContent.slice(offset, offset + limit);
      const hasMore = offset + limit < totalFromDB;

      return {
        articles: paginated,
        total: totalFromDB,
        hasMore,
      };
    }
  } catch (dbError) {
    // データベースからの取得に失敗した場合は、ファイルから読み込む
    if (shouldLogWarning()) {
      console.warn(
        `データベースからの取得に失敗、ファイルから読み込みます:`,
        dbError instanceof Error ? dbError.message : String(dbError)
      );
    }
  }

  // データベースにデータがない場合は、従来通りファイルから読み込み
  const filePaths = await listMDXFiles(filter.category);

  // 各ファイルを読み込んでArticleオブジェクトに変換
  const articles: Article[] = [];

  for (const filePath of filePaths) {
    try {
      const article = await readMDXFile(
        filePath.category,
        filePath.slug,
        filePath.year
      );

      // descriptionと読了時間を計算
      try {
        // descriptionがない場合は抜粋を生成してfrontmatter.descriptionに設定
        if (!article.frontmatter.description) {
          article.frontmatter.description = generateExcerpt(article.content);
        }
        article.readingTime = calculateReadingTime(article.content);
      } catch (processingError) {
        // descriptionや読了時間の計算でエラーが発生した場合は、エラーを記録して続行
        console.warn(
          `Failed to process article metadata: ${filePath.fullPath}`,
          processingError instanceof Error
            ? `${processingError.message}${
                processingError.stack ? `\nStack: ${processingError.stack}` : ""
              }`
            : String(processingError)
        );
        // descriptionや読了時間が設定されていなくても記事自体は有効
      }

      articles.push(article);
    } catch (error) {
      // 個別ファイルの読み込みエラーは無視して続行
      const errorMessage =
        error instanceof Error
          ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ""}`
          : typeof error === "string"
          ? error
          : JSON.stringify(error);
      console.error(
        `Failed to load article: ${filePath.fullPath}`,
        errorMessage
      );
      continue;
    }
  }

  // フィルタリング
  const filtered = filterArticles(articles, filter);

  // ソート
  const sorted = sortArticles(filtered, sortOrder);

  // ページネーション処理
  const limit = filter.limit || 10;
  const offset = filter.offset || 0;
  const paginated = sorted.slice(offset, offset + limit);
  const hasMore = offset + limit < sorted.length;

  return {
    articles: paginated,
    total: sorted.length,
    hasMore,
  };
}

/**
 * すべての記事を取得（ページネーションなし）
 *
 * データベース優先で読み込み、データベースにデータがない場合はファイルから読み込みます。
 *
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事配列
 */
export async function getAllArticles(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<Article[]> {
  // まずデータベースから取得を試みる
  try {
    const articlesFromDB = await listArticlesFromDB(
      { ...filter, limit: undefined, offset: undefined },
      sortOrder
    );

    // データベースにデータがある場合は、コンテンツをファイルから読み込む
    if (articlesFromDB.length > 0) {
      const articlesWithContent: Article[] = [];

      for (const article of articlesFromDB) {
        try {
          const articleFromFile = await readMDXFile(
            article.actualCategory,
            article.slug,
            article.time || ""
          );
          article.content = articleFromFile.content;
        } catch (fileError) {
          // ファイルが見つからない場合は空コンテンツのまま
          if (shouldLogWarning()) {
            console.warn(
              `ファイルが見つかりませんが、データベースから取得しました: ${article.actualCategory}/${article.slug}/${article.time}.mdx`
            );
          }
        }
        articlesWithContent.push(article);
      }

      return articlesWithContent;
    }
  } catch (dbError) {
    // データベースからの取得に失敗した場合は、ファイルから読み込む
    if (shouldLogWarning()) {
      console.warn(
        `データベースからの取得に失敗、ファイルから読み込みます:`,
        dbError instanceof Error ? dbError.message : String(dbError)
      );
    }
  }

  // データベースにデータがない場合は、従来通りファイルから読み込み
  const filePaths = await listMDXFiles(filter.category);

  // 各ファイルを読み込んでArticleオブジェクトに変換
  const articles: Article[] = [];

  for (const filePath of filePaths) {
    try {
      const article = await readMDXFile(
        filePath.category,
        filePath.slug,
        filePath.year
      );

      // descriptionと読了時間を計算
      try {
        // descriptionがない場合は抜粋を生成してfrontmatter.descriptionに設定
        if (!article.frontmatter.description) {
          article.frontmatter.description = generateExcerpt(article.content);
        }
        article.readingTime = calculateReadingTime(article.content);
      } catch (processingError) {
        // descriptionや読了時間の計算でエラーが発生した場合は、エラーを記録して続行
        console.warn(
          `Failed to process article metadata: ${filePath.fullPath}`,
          processingError instanceof Error
            ? `${processingError.message}${
                processingError.stack ? `\nStack: ${processingError.stack}` : ""
              }`
            : String(processingError)
        );
        // descriptionや読了時間が設定されていなくても記事自体は有効
      }

      articles.push(article);
    } catch (error) {
      // 個別ファイルの読み込みエラーは無視して続行
      const errorMessage =
        error instanceof Error
          ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ""}`
          : typeof error === "string"
          ? error
          : JSON.stringify(error);
      console.error(
        `Failed to load article: ${filePath.fullPath}`,
        errorMessage
      );
      continue;
    }
  }

  // フィルタリング
  const filtered = filterArticles(articles, filter);

  // ソート
  return sortArticles(filtered, sortOrder);
}
