import { LayoutDashboard } from "lucide-react";

import { RailCard, RailLinkList, RailNavRow } from "@/components/surface";

import { listRelatedThemesForRankingKeys } from "@/features/theme-dashboard/server";

interface RelatedThemesCardProps {
  rankingKey: string;
}

/**
 * この指標を主指標・副指標として使うテーマ。ランキング (1 指標) からテーマ (複数指標の解釈) へ深掘りする導線。
 * テーマは 47 都道府県を主語にするので、県のランキングでだけ出す (呼び元が判定する)。
 */
export function RelatedThemesCard({ rankingKey }: RelatedThemesCardProps) {
  const themes = listRelatedThemesForRankingKeys([rankingKey], { limit: 3 });
  if (themes.length === 0) return null;

  return (
    <RailCard
      title="この指標を使うテーマ"
      icon={<LayoutDashboard className="h-4 w-4 text-muted-foreground" />}
    >
      <RailLinkList>
        {themes.map((theme) => (
          <RailNavRow key={theme.themeKey} href={theme.href} chevron={false}>
            <span className="line-clamp-2 leading-snug">{theme.title}</span>
          </RailNavRow>
        ))}
      </RailLinkList>
    </RailCard>
  );
}
