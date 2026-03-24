"use client";

import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";

interface AiContentAccordionProps {
  title: string;
  children: ReactNode;
}

/** AI 生成コンテンツの折りたたみセクション（汎用） */
export function AiContentAccordion({ title, children }: AiContentAccordionProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="content" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <h3 className="text-lg font-semibold">{title}</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
