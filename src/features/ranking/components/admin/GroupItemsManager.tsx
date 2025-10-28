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

import type { RankingGroup, RankingItem } from "../../types";

interface GroupItemsManagerProps {
  group: RankingGroup;
  ungroupedItems: RankingItem[];
}

export function GroupItemsManager({
  group,
  ungroupedItems,
}: GroupItemsManagerProps) {
  const [selectedUngrouped, setSelectedUngrouped] = useState<Set<number>>(
    new Set()
  );
  const [selectedGrouped, setSelectedGrouped] = useState<Set<number>>(
    new Set()
  );

  const handleUngroupedToggle = (itemId: number) => {
    const newSet = new Set(selectedUngrouped);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedUngrouped(newSet);
  };

  const handleGroupedToggle = (itemId: number) => {
    const newSet = new Set(selectedGrouped);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
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
              group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <Checkbox
                    checked={selectedGrouped.has(item.id)}
                    onCheckedChange={() => handleGroupedToggle(item.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))
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
              ungroupedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <Checkbox
                    checked={selectedUngrouped.has(item.id)}
                    onCheckedChange={() => handleUngroupedToggle(item.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unit}
                    </div>
                  </div>
                </div>
              ))
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
