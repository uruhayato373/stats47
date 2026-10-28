import { type ReactNode } from "react";

import { Badge } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { metricDisplayName, metricShortName } from "@stats47/ranking";
import { ChevronDown } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { SectionCard } from "@/components/surface";

import { navSurfaceProps } from "@/lib/analytics/events";

import type { CategoryTopicListItem } from "./types";

/**
 * カテゴリ内グループ一覧 (server component / client JS ゼロ)。
 *
 * 平坦な 110 行テーブルの代わりに、意味のあるまとまりごとの区切りを並べる。
 * 節の題名 (「全41件のランキング」) はアイコン付きでカードの見出しに置き、各まとまりはカードを入れ子にせず
 * 罫線で区切ったセクションにする (テンプレートのカード内の表と同じ)。
 * 分類の SSOT は `packages/data-configs/src/topics/`、R2 items.json への
 * 焼き込みは `ranking-items-per-url-snapshot.ts`。
 *
 * ## 同名タイトルを畳む
 *
 * 実測 (2026-08-05) で laborwage は 110 件中 48 件が同名で、区別は subtitle のみだった
 * (「趣味・娯楽の平均時間」が男女×有業/非有業で 4 回並ぶ)。タイトル同値で 1 行に畳み、
 * subtitle を並列のリンクとして出すと 4 行が 1 行に見える。畳みはタイトルの同値だけで
 * 決まるので新しい SSOT を要さない。
 */

const VISIBLE_ROWS = 5;

interface Props {
  topics: { key: string; label: string }[];
  items: CategoryTopicListItem[];
  /** 節の題名。渡すとカードの見出し (h2) に置き、まとまりをカードの中に並べる */
  title?: ReactNode;
  icon?: ReactNode;
}

/** タイトルが同じ item を 1 行に畳む。順序は入力順を保つ */
interface CollapsedRow {
  title: string;
  variants: CategoryTopicListItem[];
}

function collapseByTitle(items: CategoryTopicListItem[]): CollapsedRow[] {
  const rows = new Map<string, CollapsedRow>();
  for (const item of items) {
    const row = rows.get(item.title);
    if (row) row.variants.push(item);
    else rows.set(item.title, { title: item.title, variants: [item] });
  }
  return [...rows.values()];
}

function TopicRow({ row }: { row: CollapsedRow }) {
  // 値を出す行は総数 (subtitle なし) を優先する。内訳の値を黙って出すと総数に見える
  // (2026-09-27: 「外国人人口 東京都 1,393.4人」が中国籍の人口10万人当たりだった)
  const primary = row.variants.find((v) => !v.subtitle) ?? row.variants[0];
  const hasVariants = row.variants.length > 1;
  // 分母・内訳は subtitle が持つ (unit-semantics-standards §4)。落とすと「道路実延長 12.46km」のように実数に見える
  // 内訳が複数ある行は内訳を値の横に出すので、名前には付けない
  const readerLabel = hasVariants
    ? metricShortName({ title: row.title, readerLabel: primary.readerLabel })
    : metricDisplayName({ title: row.title, readerLabel: primary.readerLabel, subtitle: primary.subtitle });

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 px-4 py-2">
        <div className="flex items-baseline justify-between gap-3">
          {hasVariants ? (
            <span className="min-w-0 flex-1 truncate text-sm">{readerLabel}</span>
          ) : (
            <Link
              {...navSurfaceProps("category_ranking_list")}
              href={hrefFor("ranking", { rankingKey: primary.rankingKey })}
              className="min-w-0 flex-1 truncate text-sm hover:text-primary hover:underline"
            >
              {readerLabel}
            </Link>
          )}
          {primary.top1 ? (
            <span className="max-w-[60%] shrink-0 truncate text-right text-xs tabular-nums text-muted-foreground">
              {primary.top1.areaName}
              {primary.top1.value ? (
                <>
                  {" "}
                  <span className="font-bold text-foreground">
                    {primary.top1.value}
                    {formatUnitForDisplay(primary.unit)}
                  </span>
                  {hasVariants && primary.subtitle ? <>（{primary.subtitle}）</> : null}
                </>
              ) : null}
            </span>
          ) : null}
        </div>
        {hasVariants && (
          // 同名の内訳。subtitle でしか区別できない行を並列に見せる
          <div className="flex flex-wrap gap-1">
            {row.variants.map((variant) => (
              <Link
                {...navSurfaceProps("category_ranking_list")}
                key={variant.rankingKey}
                href={hrefFor("ranking", { rankingKey: variant.rankingKey })}
                className="border border-border px-1.5 text-xs leading-5 text-muted-foreground hover:border-primary hover:text-primary"
              >
                {variant.subtitle ?? "総数"}
              </Link>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function TopicGroup({
  label,
  items,
}: {
  label: string;
  items: CategoryTopicListItem[];
}) {
  const rows = collapseByTitle(items);
  const visible = rows.slice(0, VISIBLE_ROWS);
  const hidden = rows.slice(VISIBLE_ROWS);

  return (
    // 枠はカードの見出しの外側 (SectionCard) だけが持つ。まとまりは罫線で区切る (2 列のときは間にも縦線)
    <section aria-label={label} className="border-b border-border @md:odd:border-r">
      {/* 見出しは表の行に近い高さ (min-h-13 ≒ 52px) に詰める。地の色は付けず、罫線だけで区切る */}
      <div className="flex min-h-13 items-center justify-between gap-2 border-b border-border px-4">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <Badge variant="secondary" className="tabular-nums">
          {rows.length}
        </Badge>
      </div>
      <ul>
        {visible.map((row) => (
          <TopicRow key={row.title} row={row} />
        ))}
      </ul>
      {hidden.length > 0 && (
        // client JS を足さずに展開する。検索 input は置かない
        // (CategoryRankingListClient の「textbox を出さない」契約と揃える)
        <details className="group/more border-t border-dashed border-border">
          {/* 開閉の行にも他の行と同じ大きさの矢印を付ける (開くと上向き) */}
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 text-xs text-primary hover:underline [&::-webkit-details-marker]:hidden">
            すべて見る（残り {hidden.length} 件）
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open/more:rotate-180"
            />
          </summary>
          <ul className="border-t border-border">
            {hidden.map((row) => (
              <TopicRow key={row.title} row={row} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function CategoryTopicGroups({ topics, items, title, icon }: Props) {
  const byTopic = new Map<string, CategoryTopicListItem[]>();
  for (const item of items) {
    if (!item.topicKey) continue;
    const bucket = byTopic.get(item.topicKey);
    if (bucket) bucket.push(item);
    else byTopic.set(item.topicKey, [item]);
  }

  const cards = topics.flatMap((topic) => {
    const bucket = byTopic.get(topic.key);
    return bucket && bucket.length > 0 ? [{ ...topic, items: bucket }] : [];
  });
  if (cards.length === 0) return null;

  // 列数は本文の幅 (@container) で決める。最後の行の下罫線はカードの線と重ならないよう -mb-px で隠す
  const groups = (
    <div className="@container">
      <div className="-mb-px grid grid-cols-1 @md:grid-cols-2">
        {cards.map((card) => (
          <TopicGroup key={card.key} label={card.label} items={card.items} />
        ))}
      </div>
    </div>
  );
  if (!title) return groups;

  return (
    <SectionCard
      title={title}
      icon={icon}
      headingAs="h2"
      // まとまりは自分の罫線と余白を持つので、本文の余白を外して罫線をカードの線まで届かせる
      bodyClassName="px-0 py-0"
    >
      {groups}
    </SectionCard>
  );
}
