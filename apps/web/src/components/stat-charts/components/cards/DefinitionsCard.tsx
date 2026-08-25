import React from "react";

import { Table, TableBody, TableCell, TableRow } from "@stats47/components";
import { Badge } from "@stats47/components/atoms/ui/badge";
import { Icon } from "@stats47/components/atoms/ui/icon";
import { InfoIcon } from "lucide-react";

import { ContentDisclosure } from "@/components/content";
import { SurfaceCard } from "@/components/surface";

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
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: "text-red-600",
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
    <SurfaceCard className={`overflow-hidden shadow-none ${colors.border} ${colors.bg}`}>
      {/* ヘッダー */}
      <div className={`flex items-center gap-2 border-b pb-3 ${colors.border}`}>
        {iconName && <Icon name={iconName} className={`h-4 w-4 ${colors.icon}`} />}
        <span className={`font-semibold text-sm ${colors.text}`}>{group.name}</span>
      </div>

      {/* 説明文 */}
      {group.description && (
        <p className="pt-2 text-sm text-muted-foreground">{group.description}</p>
      )}

      {/* アイテムテーブル */}
      <div className="pt-2">
        <Table>
          <TableBody>
            {group.items.map((item) => (
              <TableRow key={item.name} className="border-b border-border/40 last:border-0 hover:bg-transparent">
                <TableCell className="pr-2 text-foreground">{item.name}</TableCell>
                {item.cat01 && (
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.cat01}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SurfaceCard>
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
    <ContentDisclosure
      title={title}
      headingLevel={3}
      leading={<InfoIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      description={data.description}
      meta={
        data.badge ? (
          <Badge variant="secondary" className="text-[10px]">
            {data.badge}
          </Badge>
        ) : undefined
      }
    >
      {/* グループグリッド */}
      <div className="@container mt-2 grid grid-cols-1 gap-4 @md:grid-cols-2">
        {data.groups.map((group) => (
          <GroupCard key={group.name} group={group} />
        ))}
      </div>

      {/* データソース */}
      {data.source && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-center text-sm text-muted-foreground">
            データソース: {data.source}
          </p>
        </div>
      )}
    </ContentDisclosure>
  );
};
