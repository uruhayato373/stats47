import { METRICS_REGISTRY } from '@stats47/data-configs';
import {
  EVIDENCE_LENS_CATALOG,
  EVIDENCE_SOURCE_CATALOG,
  THEME_CATALOGS,
} from '@stats47/data-configs/theme-catalog';
import { BookOpenText } from 'lucide-react';

import { SectionCard } from '@/components/surface';

import { TrackedThemeLink } from './TrackedThemeLink';

/**
 * 白書・報告書から採択した論点を、関連ランキング・テーマ・記事へ接続する。
 * 論点は ThemeCatalog の従属メタデータであり、独立した taxonomy URL は作らない。
 */
export function ThemeEvidenceTopicsSection({ themeKey }: { themeKey: string }) {
  const catalog = THEME_CATALOGS[themeKey];
  const topics = catalog?.evidenceTopics ?? [];

  if (topics.length === 0) return null;

  return (
    <section
      id="theme-evidence"
      className="mt-8"
      aria-labelledby="theme-evidence-topics-title"
    >
      <div className="flex items-center gap-2">
        <BookOpenText className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2
          id="theme-evidence-topics-title"
          className="text-xl font-bold text-foreground"
        >
          白書・統計から見る論点
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        公的資料の論点から、関連する都道府県データと次に読むテーマを整理しています。
      </p>

      <SectionCard
        className="mt-3"
        bodyClassName="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {topics.map((topic) => {
          const lens = EVIDENCE_LENS_CATALOG[topic.lensKey];
          const rankings = (topic.relatedRankingKeys ?? []).flatMap(
            (rankingKey) => {
              const metric = METRICS_REGISTRY[rankingKey];
              return metric ? [{ key: rankingKey, title: metric.title }] : [];
            }
          );
          const themes = (topic.relatedThemeKeys ?? []).flatMap(
            (relatedThemeKey) => {
              const related = THEME_CATALOGS[relatedThemeKey];
              return related
                ? [{ key: relatedThemeKey, title: related.title }]
                : [];
            }
          );
          const sources = topic.sourceKeys.map((sourceKey) => ({
            key: sourceKey,
            ...EVIDENCE_SOURCE_CATALOG[sourceKey],
          }));

          return (
            <article
              key={topic.key}
              id={`evidence-${topic.key}`}
              className="min-w-0"
            >
              <p className="text-xs font-medium text-primary">{lens.label}</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {topic.title}
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {topic.question}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {topic.summary}
              </p>

              {rankings.length > 0 && (
                <nav
                  className="mt-4"
                  aria-label={`${topic.title}の関連ランキング`}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    関連ランキング
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {rankings.map((ranking) => {
                      const href = `/ranking/${ranking.key}`;
                      return (
                        <TrackedThemeLink
                          key={ranking.key}
                          href={href}
                          trackingLabel={`${topic.key}:ranking:${ranking.key}`}
                          surface="theme_evidence"
                          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          {ranking.title}
                        </TrackedThemeLink>
                      );
                    })}
                  </div>
                </nav>
              )}

              {themes.length > 0 && (
                <nav className="mt-3" aria-label={`${topic.title}の関連テーマ`}>
                  <p className="text-xs font-medium text-muted-foreground">
                    別の視点で見る
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {themes.map((theme) => {
                      const href = `/themes/${theme.key}`;
                      return (
                        <TrackedThemeLink
                          key={theme.key}
                          href={href}
                          trackingLabel={`${topic.key}:theme:${theme.key}`}
                          surface="theme_evidence"
                          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          {theme.title}
                        </TrackedThemeLink>
                      );
                    })}
                  </div>
                </nav>
              )}

              {(topic.relatedArticleTagKeys?.length ?? 0) > 0 && (
                <nav className="mt-3" aria-label={`${topic.title}の関連記事`}>
                  <p className="text-xs font-medium text-muted-foreground">
                    関連記事
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {topic.relatedArticleTagKeys?.map((tagKey) => {
                      const href = `/tag/${tagKey}`;
                      return (
                        <TrackedThemeLink
                          key={tagKey}
                          href={href}
                          trackingLabel={`${topic.key}:tag:${tagKey}`}
                          surface="theme_evidence"
                          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          #{tagKey}
                        </TrackedThemeLink>
                      );
                    })}
                  </div>
                </nav>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  参考資料
                </p>
                <ul className="mt-1 space-y-1">
                  {sources.map((source) => (
                    <li
                      key={source.key}
                      className="text-xs text-muted-foreground"
                    >
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        {source.title}
                      </a>
                      <span>（{source.publisher}）</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </SectionCard>
    </section>
  );
}
