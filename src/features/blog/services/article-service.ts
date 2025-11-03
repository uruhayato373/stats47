/**
 * 記事サービス
 * 
 * ビジネスロジック層：記事取得、一覧取得、データ変換を担当
 */

import type {
  Article,
  ArticleFilter,
  ArticleListResponse,
  ArticleSortOrder,
} from "../types/article.types";
import {
  listMDXFiles,
  readMDXFile,
  type ArticleFilePath,
} from "../repositories/article-repository";

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

  return lastSpace > 0 ? truncated.slice(0, lastSpace) + "..." : truncated + "...";
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
  const japaneseChars = (plainText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
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
      sorted.sort((a, b) => {
        const dateA = new Date(a.frontmatter.date).getTime();
        const dateB = new Date(b.frontmatter.date).getTime();
        return dateB - dateA;
      });
      break;

    case "date-asc":
      sorted.sort((a, b) => {
        const dateA = new Date(a.frontmatter.date).getTime();
        const dateB = new Date(b.frontmatter.date).getTime();
        return dateA - dateB;
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
      (article) => article.frontmatter.category === filter.category
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

  // 年度でフィルタ
  if (filter.year) {
    filtered = filtered.filter((article) => article.year === filter.year);
  }

  return filtered;
}

/**
 * スラッグと年度から記事を取得
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
  // まず指定されたカテゴリで試す
  try {
    const article = await readMDXFile(category, slug, year);
    // 抜粋と読了時間を計算
    article.excerpt = generateExcerpt(article.content);
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
      // 抜粋と読了時間を計算
      article.excerpt = generateExcerpt(article.content);
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
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事一覧レスポンス
 */
export async function listArticles(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<ArticleListResponse> {
  // Repository層からファイル一覧を取得
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

      // 抜粋と読了時間を計算
      try {
        article.excerpt = generateExcerpt(article.content);
        article.readingTime = calculateReadingTime(article.content);
      } catch (processingError) {
        // 抜粋や読了時間の計算でエラーが発生した場合は、エラーを記録して続行
        console.warn(
          `Failed to process article metadata: ${filePath.fullPath}`,
          processingError instanceof Error
            ? `${processingError.message}${processingError.stack ? `\nStack: ${processingError.stack}` : ""}`
            : String(processingError)
        );
        // 抜粋や読了時間が設定されていなくても記事自体は有効
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
 * @param filter - フィルタ条件
 * @param sortOrder - ソート順（デフォルト: "date-desc"）
 * @returns 記事配列
 */
export async function getAllArticles(
  filter: ArticleFilter = {},
  sortOrder: ArticleSortOrder = "date-desc"
): Promise<Article[]> {
  // Repository層からファイル一覧を取得
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

      // 抜粋と読了時間を計算
      try {
        article.excerpt = generateExcerpt(article.content);
        article.readingTime = calculateReadingTime(article.content);
      } catch (processingError) {
        // 抜粋や読了時間の計算でエラーが発生した場合は、エラーを記録して続行
        console.warn(
          `Failed to process article metadata: ${filePath.fullPath}`,
          processingError instanceof Error
            ? `${processingError.message}${processingError.stack ? `\nStack: ${processingError.stack}` : ""}`
            : String(processingError)
        );
        // 抜粋や読了時間が設定されていなくても記事自体は有効
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

