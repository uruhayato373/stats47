"use client";

import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";

import { SurfaceCard } from "@/components/surface";

interface AiContentAccordionProps {
  title: string;
  children: ReactNode;
  /**
   * 外枠カード（border + shadow）を描画するか。
   * 既定 true（独立カードとして表示）。別カード内にネストする際は false にして枠の二重化を避ける。
   */
  bordered?: boolean;
}

/** AI 生成コンテンツの折りたたみセクション（汎用） */
export function AiContentAccordion({ title, children, bordered = true }: AiContentAccordionProps) {
  const accordion = (
    <Accordion type="single" collapsible>
      <AccordionItem value="content" className="border-none">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <h2 className="text-lg font-semibold">{title}</h2>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-0">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (!bordered) return accordion;

  return <SurfaceCard className="p-0">{accordion}</SurfaceCard>;
}
