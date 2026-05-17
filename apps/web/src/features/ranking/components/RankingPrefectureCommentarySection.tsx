"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";

interface PrefectureCommentaryItem {
  areaCode: string;
  areaName: string;
  rank: number;
  value: number;
  commentary: string;
}

interface RankingPrefectureCommentarySectionProps {
  /** prefectureCommentary を JSON 化した文字列 (R2 snapshot の field) */
  commentaryJson: string | null;
  rankingName: string;
  unit: string;
}

function isValidItem(v: unknown): v is PrefectureCommentaryItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.areaCode === "string" && o.areaCode.length === 5 &&
    typeof o.areaName === "string" && o.areaName.length > 0 &&
    typeof o.rank === "number" &&
    typeof o.value === "number" &&
    typeof o.commentary === "string" && o.commentary.length > 0
  );
}

function parseCommentary(raw: unknown): PrefectureCommentaryItem[] | null {
  if (!raw || typeof raw !== "object") return null;
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const valid = items.filter(isValidItem);
  return valid.length > 0 ? valid : null;
}

/**
 * 47 都道府県別の解説セクション。
 * SEO 長尾 (例: 「秋田県の○○ランキング」) を捕捉するため、各県の独立した解説を持つ。
 * Accordion で展開、アンカー (#pref-XXXXX) で deep link 可能。
 */
export function RankingPrefectureCommentarySection({
  commentaryJson,
  rankingName,
  unit,
}: RankingPrefectureCommentarySectionProps) {
  if (!commentaryJson) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(commentaryJson);
  } catch {
    return null;
  }

  const items = parseCommentary(parsed);
  if (!items) return null;

  const sorted = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <section
      aria-labelledby="prefecture-commentary-heading"
      className="rounded-lg border bg-card shadow-sm"
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="root" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <h2
              id="prefecture-commentary-heading"
              className="text-lg font-semibold"
            >
              都道府県別の解説（全{sorted.length}県）
            </h2>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <p className="mb-3 text-sm text-muted-foreground">
              各都道府県の「{rankingName}」について、順位と簡単な解説を掲載しています。
            </p>
            <Accordion type="multiple" className="border-t">
              {sorted.map((item) => (
                <AccordionItem
                  key={item.areaCode}
                  value={item.areaCode}
                  id={`pref-${item.areaCode}`}
                  className="scroll-mt-24"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-4 text-left">
                      <span className="font-medium text-slate-900">
                        <span className="mr-2 inline-block min-w-[2.5em] text-right text-sm text-muted-foreground">
                          {item.rank}位
                        </span>
                        {item.areaName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.value.toLocaleString()}
                        {unit}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 text-sm leading-relaxed text-slate-700">
                    {item.commentary}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
