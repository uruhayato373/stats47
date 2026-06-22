import Link from "next/link";

import { MapPin, ChevronRight } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

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
    <SurfaceCard className="p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          関連ページ
        </h3>
      </div>
      <div className="px-4 pb-4 pt-3">
        <nav className="flex flex-col gap-1">
          <Link
            href="/themes/ports"
            className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            <span className="text-sm leading-snug">
              港湾テーマで詳しく見る
            </span>
          </Link>
        </nav>
      </div>
    </SurfaceCard>
  );
}
