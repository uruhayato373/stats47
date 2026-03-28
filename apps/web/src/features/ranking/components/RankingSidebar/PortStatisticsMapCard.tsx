import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { MapPin, ChevronRight } from "lucide-react";

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
    <Card>
      <CardHeader className="py-3 px-4">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          関連ページ
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <nav className="flex flex-col gap-1">
          <Link
            href="/ports"
            className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            <span className="text-sm leading-snug">
              港湾統計マップで詳しく見る
            </span>
          </Link>
        </nav>
      </CardContent>
    </Card>
  );
}
