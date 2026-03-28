"use client";

import React from "react";

import { Table, TableBody, TableCell, TableRow } from "@stats47/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";
import { Badge } from "@stats47/components/atoms/ui/badge";
import { Icon } from "@stats47/components/atoms/ui/icon";
import { InfoIcon } from "lucide-react";

import { getDefinitionSet } from "../../data/definitions";

import type { DashboardItemProps, DefinitionGroup } from "../../types";

// ---------------------------------------------------------------------------
// カラーマッピング: config の color 文字列 → Tailwind クラス
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: "text-amber-600",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-600",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    icon: "text-rose-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    icon: "text-purple-600",
  },
};

const DEFAULT_COLOR = {
  bg: "bg-muted/50",
  border: "border-border",
  text: "text-foreground",
  icon: "text-muted-foreground",
};

// ---------------------------------------------------------------------------
// アイコン名マッピング: config の小文字名 → Lucide PascalCase 名
// ---------------------------------------------------------------------------

const ICON_NAME_MAP: Record<string, string> = {
  wallet: "Wallet",
  building: "Building2",
  landmark: "Landmark",
  coins: "Coins",
  banknote: "Banknote",
  receipt: "Receipt",
  "piggy-bank": "PiggyBank",
  "hand-coins": "HandCoins",
};

// ---------------------------------------------------------------------------
// GroupCard — グループ1つ分のカード
// ---------------------------------------------------------------------------

const GroupCard: React.FC<{ group: DefinitionGroup }> = ({ group }) => {
  const colors = (group.color && COLOR_MAP[group.color]) || DEFAULT_COLOR;
  const iconName = group.icon ? ICON_NAME_MAP[group.icon] || group.icon : undefined;

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* ヘッダー */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${colors.border}`}>
        {iconName && <Icon name={iconName} className={`h-4 w-4 ${colors.icon}`} />}
        <span className={`font-semibold text-sm ${colors.text}`}>{group.name}</span>
      </div>

      {/* 説明文 */}
      {group.description && (
        <p className="px-4 pt-2 text-xs text-muted-foreground">{group.description}</p>
      )}

      {/* アイテムテーブル */}
      <div className="px-4 py-2">
        <Table className="w-full text-sm">
          <TableBody>
            {group.items.map((item) => (
              <TableRow key={item.name} className="border-b border-border/40 last:border-0 hover:bg-transparent">
                <TableCell className="py-1.5 pr-2 text-foreground">{item.name}</TableCell>
                {item.cat01 && (
                  <TableCell className="py-1.5 text-right text-xs font-mono text-muted-foreground">
                    {item.cat01}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DefinitionsCard — レジストリからデータ取得 → リッチ表示
// ---------------------------------------------------------------------------

export const DefinitionsCard: React.FC<DashboardItemProps<"definitions-card">> = ({
  common,
  config,
}) => {
  const data = getDefinitionSet(config.definitionSetKey);

  if (!data) {
    return null;
  }

  const title = common.title || "統計の定義";

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="definitions" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              <InfoIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {data.badge && (
                    <Badge variant="secondary" className="text-[10px]">
                      {data.badge}
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                {data.description && (
                  <p className="text-sm text-muted-foreground font-normal">
                    {data.description}
                  </p>
                )}
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-0">
            {/* グループグリッド */}
            <div className="@container grid grid-cols-1 @md:grid-cols-2 gap-4 mt-2">
              {data.groups.map((group) => (
                <GroupCard key={group.name} group={group} />
              ))}
            </div>

            {/* データソース */}
            {data.source && (
              <div className="mt-4 pt-3 border-t border-border/60">
                <p className="text-xs text-muted-foreground text-center">
                  データソース: {data.source}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
