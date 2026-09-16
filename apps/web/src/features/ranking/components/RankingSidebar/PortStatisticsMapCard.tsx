import { MapPin, ChevronRight } from "lucide-react";

import { RailCard, RailLinkItem, RailLinkList } from "@/components/surface";

const PORT_GROUP_KEY = "port-statistics-pref";

interface PortStatisticsMapCardProps {
  rankingKey: string;
  groupKey?: string | null;
}

export function PortStatisticsMapCard({
  groupKey,
}: PortStatisticsMapCardProps) {
  if (groupKey !== PORT_GROUP_KEY) return null;

  return (
    <RailCard
      title="関連ページ"
      icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
    >
      <RailLinkList>
        <RailLinkItem
          href="/themes/ports"
          className="items-start gap-2 hover:bg-accent/50"
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
          <span className="leading-snug">港湾テーマで詳しく見る</span>
        </RailLinkItem>
      </RailLinkList>
    </RailCard>
  );
}
