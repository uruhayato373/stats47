import Link from "next/link";

import { SurfaceCard } from "@/components/surface";

import type { CategoryTopicListItem } from "./types";

/**
 * カテゴリ内グループ一覧 (server component / client JS ゼロ)。
 *
 * 平坦な 110 行テーブルの代わりに、意味のあるまとまりごとのカードを並べる。
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
  const [primary] = row.variants;
  const hasVariants = row.variants.length > 1;
  const readerLabel = primary.readerLabel ?? row.title;

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          {hasVariants ? (
            <span className="min-w-0 flex-1 truncate text-[13px]">{readerLabel}</span>
          ) : (
            <Link
              href={`/ranking/${primary.rankingKey}`}
              className="min-w-0 flex-1 truncate text-[13px] hover:text-primary hover:underline"
            >
              {readerLabel}
            </Link>
          )}
          {primary.top1 ? (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {primary.top1.areaName}
              {primary.top1.value ? (
                <>
                  {" "}
                  <span className="font-bold text-foreground">
                    {primary.top1.value}
                    {primary.unit}
                  </span>
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
                key={variant.rankingKey}
                href={`/ranking/${variant.rankingKey}`}
                className="border border-border px-1.5 text-[11px] leading-[18px] text-muted-foreground hover:border-primary hover:text-primary"
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

function TopicCard({
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
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="flex-1 text-[13px] font-bold">{label}</h3>
        <span className="border border-border bg-accent px-1.5 text-[11px] tabular-nums text-accent-foreground">
          {rows.length}
        </span>
      </div>
      <ul>
        {visible.map((row) => (
          <TopicRow key={row.title} row={row} />
        ))}
      </ul>
      {hidden.length > 0 && (
        // client JS を足さずに展開する。検索 input は置かない
        // (CategoryRankingListClient の「textbox を出さない」契約と揃える)
        <details className="border-t border-dashed border-border">
          <summary className="cursor-pointer px-3 py-2 text-[11.5px] text-primary hover:underline">
            すべて見る（残り {hidden.length} 件）
          </summary>
          <ul className="border-t border-border">
            {hidden.map((row) => (
              <TopicRow key={row.title} row={row} />
            ))}
          </ul>
        </details>
      )}
    </SurfaceCard>
  );
}

export function CategoryTopicGroups({ topics, items }: Props) {
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

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {cards.map((card) => (
        <TopicCard key={card.key} label={card.label} items={card.items} />
      ))}
    </div>
  );
}
