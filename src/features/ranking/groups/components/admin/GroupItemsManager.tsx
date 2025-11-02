"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Checkbox } from "@/components/atoms/ui/checkbox";

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
  // rankingKey:areaTypeの組み合わせで一意のキーを生成
  const getItemKey = (item: RankingItem) =>
    `${item.rankingKey}:${item.areaType}`;

  const [selectedUngrouped, setSelectedUngrouped] = useState<Set<string>>(
    new Set()
  );
  const [selectedGrouped, setSelectedGrouped] = useState<Set<string>>(
    new Set()
  );

  const handleUngroupedToggle = (itemKey: string) => {
    const newSet = new Set(selectedUngrouped);
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey);
    } else {
      newSet.add(itemKey);
    }
    setSelectedUngrouped(newSet);
  };

  const handleGroupedToggle = (itemKey: string) => {
    const newSet = new Set(selectedGrouped);
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey);
    } else {
      newSet.add(itemKey);
    }
    setSelectedGrouped(newSet);
  };

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
              group.items.map((item) => {
                const itemKey = getItemKey(item);
                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-2 p-2 rounded border"
                  >
                    <Checkbox
                      checked={selectedGrouped.has(itemKey)}
                      onCheckedChange={() => handleGroupedToggle(itemKey)}
                    />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
                );
              })
            )}
            {selectedGrouped.size > 0 && (
              <div className="pt-2 border-t">
                <Button variant="destructive" size="sm" className="w-full">
                  選択項目を削除
                </Button>
              </div>
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
              ungroupedItems.map((item) => {
                const itemKey = getItemKey(item);
                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-2 p-2 rounded border"
                  >
                    <Checkbox
                      checked={selectedUngrouped.has(itemKey)}
                      onCheckedChange={() => handleUngroupedToggle(itemKey)}
                    />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
                );
              })
            )}
            {selectedUngrouped.size > 0 && (
              <div className="pt-2 border-t">
                <Button size="sm" className="w-full">
                  選択項目を追加
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
