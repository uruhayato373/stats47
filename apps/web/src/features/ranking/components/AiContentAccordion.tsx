import type { ReactNode } from "react";

import { ContentDisclosure } from "@/components/content";

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
  return (
    <ContentDisclosure title={title} bordered={bordered}>
      {children}
    </ContentDisclosure>
  );
}
