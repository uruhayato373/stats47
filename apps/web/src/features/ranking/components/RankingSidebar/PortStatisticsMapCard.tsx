import { MapPin } from "lucide-react";

import { RailCard, RailLinkList, RailNavRow } from "@/components/surface";

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
        <RailNavRow href="/themes/ports">
          <span className="leading-snug">港湾テーマで詳しく見る</span>
        </RailNavRow>
      </RailLinkList>
    </RailCard>
  );
}
