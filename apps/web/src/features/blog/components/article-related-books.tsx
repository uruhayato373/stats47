import { BookOpen } from "lucide-react";

import {
  TAG_AFFILIATE_MAP,
  AFFILIATE_THEME,
  CATEGORY_BOOKS,
  buildAmazonUrl,
  TrackedAffiliateLink,
  type AffiliateCategory,
  type BookRecommendation,
} from "@/features/ads";

interface ArticleRelatedBooksProps {
  tagKeys: string[];
}

/**
 * 記事タグキーから関連書籍を自動判定し表示するサーバーコンポーネント。
 * 最大 2 冊まで表示。マッチなしの場合は何も表示しない。
 */
export function ArticleRelatedBooks({ tagKeys }: ArticleRelatedBooksProps) {
  const books: { category: AffiliateCategory; book: BookRecommendation }[] = [];
  const seen = new Set<AffiliateCategory>();

  for (const tagKey of tagKeys) {
    const category = TAG_AFFILIATE_MAP[tagKey];
    if (!category || seen.has(category)) continue;
    seen.add(category);

    const book = CATEGORY_BOOKS[category];
    if (book) {
      books.push({ category, book });
      if (books.length >= 2) break;
    }
  }

  if (books.length === 0) return null;

  return (
    <aside className="mt-8 border-t pt-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
          PR
        </span>
        <h2 className="text-lg font-bold text-foreground">関連書籍</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {books.map(({ category, book }) => {
          const theme = AFFILIATE_THEME[category];
          return (
            <TrackedAffiliateLink
              key={category}
              href={buildAmazonUrl(book.amazonDp)}
              category={category}
              label={book.title}
              position="related-books"
              className={`flex gap-3 rounded-xl border ${theme.border} ${theme.bg} p-4 transition-shadow hover:shadow-md`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <BookOpen size={20} className={theme.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{book.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {book.description}
                </p>
              </div>
            </TrackedAffiliateLink>
          );
        })}
      </div>
    </aside>
  );
}
