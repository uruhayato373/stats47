"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import type { RankingGroup } from "@/features/ranking/groups/types";
import type { RankingItem } from "@/features/ranking/items/types";

interface GroupItemsManagerProps {
  group: RankingGroup;
  ungroupedItems: RankingItem[];
}

export function GroupItemsManager({
  group,
  ungroupedItems,
}: GroupItemsManagerProps) {

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* グループ内の項目 */}
      <Card>
        <CardHeader>
          <CardTitle>グループ内の項目 ({group.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                グループに項目がありません
              </p>
            ) : (
              group.items.map((item) => (
                <div
                  key={`${item.rankingKey}:${item.areaType}`}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 未割り当ての項目 */}
      <Card>
        <CardHeader>
          <CardTitle>未割り当ての項目 ({ungroupedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ungroupedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                未割り当ての項目がありません
              </p>
            ) : (
              ungroupedItems.map((item) => (
                <div
                  key={`${item.rankingKey}:${item.areaType}`}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
