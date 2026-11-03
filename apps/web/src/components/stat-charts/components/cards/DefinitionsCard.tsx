import React from "react";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { Icon } from "@stats47/components/atoms/ui/icon";
import { InfoIcon } from "lucide-react";

import { ContentDisclosure } from "@/components/content";
import { SurfaceCard, ValueTable } from "@/components/surface";

import { getDefinitionSet } from "../../data/definitions";

import type { DashboardItemProps, DefinitionGroup } from "../../types";

// ---------------------------------------------------------------------------
// カラーマッピング: config の color 文字列 → Tailwind クラス
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  emerald: {
    bg: "bg-positive-soft",
    border: "border-positive/30",
    text: "text-positive",
    icon: "text-positive",
  },
  amber: {
    bg: "bg-warning-soft",
    border: "border-warning/30",
    text: "text-warning",
    icon: "text-warning",
  },
  blue: {
    bg: "bg-info-soft",
    border: "border-info/30",
    text: "text-info",
    icon: "text-info",
  },
  rose: {
    bg: "bg-negative-soft",
    border: "border-negative/30",
    text: "text-negative",
    icon: "text-negative",
  },
  purple: {
    bg: "bg-primary/5",
    border: "border-primary/30",
    text: "text-primary",
    icon: "text-primary",
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
        {/* 名前とコードの対だけの表。見出しの行は画面に出さない (共通の静的な表 ValueTable。2026-11-03)。
            コードのある項目が 1 つも無いグループは名前の列だけにする */}
        <ValueTable
          hideHeader
          ariaLabel={group.name}
          columns={[
            { key: "name", header: "項目", rowHeader: true },
            ...(group.items.some((item) => item.cat01)
              ? [{ key: "code", header: "コード", className: "font-mono text-muted-foreground" }]
              : []),
          ]}
          rows={group.items.map((item) => ({
            key: item.name,
            cells: group.items.some((entry) => entry.cat01) ? [item.name, item.cat01 ?? ""] : [item.name],
          }))}
        />
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
      bordered={false}
      headingLevel={3}
      leading={<InfoIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      description={data.description}
      meta={
        data.badge ? (
          <Badge variant="secondary">
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
