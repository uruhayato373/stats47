/**
 * ホーム注目ランキングの editorial card (presentational・仕様 doc 28 §6)。
 *
 * - 外枠は SurfaceLinkCard (rounded-none / 通常 border / hover shadow-md まで)
 * - hook 最大 2 行、数値は font-mono tabular-nums、年度・単位を省略しない
 * - card 全体が /ranking/<key> へのリンク (focus-visible は SurfaceLinkCard=Link に既定)
 * - dangerouslySetInnerHTML には trusted generator (generateMiniTileSvg) の文字列だけを渡す
 * - ここで R2 fetch / gtag を呼ばない (計測は TrackedFeaturedRankingCard)
 */
import { SurfaceLinkCard } from "@/components/surface";

import type { HomeFeaturedEditorialModel } from "../../utils/resolve-home-featured-card";
import type { FeaturedValue } from "@stats47/ranking";

export interface EditorialFeaturedCardProps {
  rankingKey: string;
  /** 正式なランキング名 (title 属性 / スクリーンリーダー補足用。hook と混在表示しない) */
  title: string;
  /** データ年度 (yearCode 4 桁) */
  year: string;
  unit: string;
  model: HomeFeaturedEditorialModel;
}

/** rank 表示 (旧 snapshot で rank 欠損の top は 1 位として表示) */
function rankLabel(value: FeaturedValue, fallbackRank: number): string {
  return `${value.rank ?? fallbackRank}位`;
}

/** 年度・単位の共通 caption (§6.1 年度・単位を省略しない) */
function CardCaption({ year, unit }: { year: string; unit: string }) {
  return (
    <p className="mt-1 text-[10px] leading-none text-muted-foreground">
      {year}年・{unit}
    </p>
  );
}

function HookHeading({ hook }: { hook: string }) {
  return (
    <span className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
      {hook}
    </span>
  );
}

function QuestionCard({ rankingKey, title, year, unit, model }: EditorialFeaturedCardProps) {
  const top = model.top as FeaturedValue;
  return (
    <SurfaceLinkCard
      href={`/ranking/${rankingKey}`}
      title={title}
      className="group relative flex h-full flex-col overflow-hidden p-3"
    >
      {model.tileMapSvg && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 right-1 h-[35%] w-[35%] opacity-[0.18] [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: model.tileMapSvg }}
        />
      )}
      <HookHeading hook={model.hook} />
      <div className="relative mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-bold leading-none tabular-nums text-primary">
            {top.value}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">{rankLabel(top, 1)}</span>
          <span className="text-sm font-semibold text-foreground">{top.areaName}</span>
        </div>
        <CardCaption year={year} unit={unit} />
      </div>
    </SurfaceLinkCard>
  );
}

function ComparisonCard({ rankingKey, title, year, unit, model }: EditorialFeaturedCardProps) {
  const top = model.top as FeaturedValue;
  const bottom = model.bottom as FeaturedValue;
  return (
    <SurfaceLinkCard
      href={`/ranking/${rankingKey}`}
      title={title}
      className="group flex h-full flex-col p-3"
    >
      <HookHeading hook={model.hook} />
      <div className="mt-auto grid grid-cols-2 gap-2">
        {/* 実 rank を表示 (§5.3 tie 保持)。rank 欠損 (旧 snapshot) の bottom は「最下位」と固定数値を出さない */}
        {[
          { entry: top, fallbackLabel: rankLabel(top, 1) },
          { entry: bottom, fallbackLabel: bottom.rank != null ? rankLabel(bottom, 0) : "最下位" },
        ].map(({ entry, fallbackLabel }, i) => (
          <div key={i} className="min-w-0">
            <p className="text-[10px] leading-none text-muted-foreground">{fallbackLabel}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {entry.areaName}
            </p>
            <p className="mt-0.5 font-mono text-lg font-bold leading-none tabular-nums text-primary">
              {entry.value}
            </p>
          </div>
        ))}
      </div>
      {/* 単位は双方に重複表示せず共通 caption に置く (§6.4) */}
      <CardCaption year={year} unit={unit} />
    </SurfaceLinkCard>
  );
}

function TerritoryCard({ rankingKey, title, year, unit, model }: EditorialFeaturedCardProps) {
  const top = model.top as FeaturedValue;
  return (
    <SurfaceLinkCard
      href={`/ranking/${rankingKey}`}
      title={title}
      className="group flex h-full flex-col overflow-hidden p-3"
    >
      <HookHeading hook={model.hook} />
      {/* map が主役 (凡例は SVG 内に含まれる)。色だけに頼らず下段に area/value を併記 (§6.5) */}
      <div
        aria-hidden="true"
        className="my-1 min-h-0 flex-1 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: model.tileMapSvg as string }}
      />
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-muted-foreground">{rankLabel(top, 1)}</span>
        <span className="text-sm font-semibold text-foreground">{top.areaName}</span>
        <span className="font-mono text-xs font-bold tabular-nums text-primary">
          {top.value}
          {unit}
        </span>
      </div>
      <CardCaption year={year} unit={unit} />
    </SurfaceLinkCard>
  );
}

function TopThreeCard({ rankingKey, title, year, unit, model }: EditorialFeaturedCardProps) {
  return (
    <SurfaceLinkCard
      href={`/ranking/${rankingKey}`}
      title={title}
      className="group flex h-full flex-col p-3"
    >
      <HookHeading hook={model.hook} />
      {/* 表彰台イラストは使わず 3 行の順位リスト。県名と値を同じ baseline に揃える (§6.6)。
          モバイル 2 列 (390px) は値 8 桁 mono が幅を圧迫するため、文字サイズ/余白を締めて
          県名の可読幅を確保する (CSS transform での縮小はしない) */}
      <ol className="mt-auto flex flex-col gap-1">
        {model.topThree.slice(0, 3).map((entry, i) => (
          <li key={i} className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="w-5 shrink-0 text-[10px] text-muted-foreground sm:w-6 sm:text-xs">
              {rankLabel(entry, i + 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground sm:text-sm">
              {entry.areaName}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-primary sm:text-sm">
              {entry.value}
            </span>
          </li>
        ))}
      </ol>
      <CardCaption year={year} unit={unit} />
    </SurfaceLinkCard>
  );
}

export function EditorialFeaturedCard(props: EditorialFeaturedCardProps) {
  switch (props.model.variant) {
    case "question":
      return <QuestionCard {...props} />;
    case "comparison":
      return <ComparisonCard {...props} />;
    case "territory":
      return <TerritoryCard {...props} />;
    case "top-three":
      return <TopThreeCard {...props} />;
  }
}
