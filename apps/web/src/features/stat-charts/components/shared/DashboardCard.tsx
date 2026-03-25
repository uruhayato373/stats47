"use client";

import React from "react";

import { cn } from "@stats47/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";
import { Loader2 } from "lucide-react";
import { parseTitle } from "../../utils/parseTitle";

export interface DashboardCardProps {
  title: string;
  rankingLink?: string | null;
  /** rankingLink のリンクラベル（未指定時は title を使用） */
  rankingLinkLabel?: string;
  description?: string;
  source?: string;
  sourceLink?: string | null;
  sourceDetail?: string;
  /** 注釈テキスト（出典とは別にカード下部に表示） */
  annotation?: string;
  /** 関連ランキングへのリンク一覧 */
  rankingLinks?: Array<{ label: string; url: string }>;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  accentColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  rankingLink,
  rankingLinkLabel,
  description,
  source,
  sourceLink,
  sourceDetail,
  annotation,
  rankingLinks,
  loading,
  error,
  empty,
  accentColor,
  className,
  children,
}) => {
  const allLinks = [
    ...(rankingLink ? [{ label: rankingLinkLabel ?? title, url: rankingLink }] : []),
    ...(rankingLinks ?? []),
  ];

  return (
  <div className={cn("@container bg-card border rounded-lg shadow-sm", className)}
    style={accentColor ? { borderColor: `${accentColor}33` } : undefined}
  >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-base leading-none">
          {(() => {
            const { main, sub } = parseTitle(title);
            return (
              <>
                {main}
                {sub && (
                  <span className="block text-xs font-normal text-muted-foreground mt-1">{sub}</span>
                )}
              </>
            );
          })()}
        </h3>
      </div>

      <div className="px-4 pt-4 pb-1.5">
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}

        {loading ? (
          <div className="h-[250px] flex items-center justify-center bg-muted/10 rounded">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-[250px] flex items-center justify-center bg-muted/10 rounded">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : empty ? (
          <div className="h-[250px] flex items-center justify-center bg-muted/10 rounded">
            <p className="text-muted-foreground text-sm">データがありません</p>
          </div>
        ) : (
          children
        )}

        {source && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            出典:{" "}
            {sourceLink ? (
              <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {source}
              </a>
            ) : (
              source
            )}
            {sourceDetail ? ` (${sourceDetail})` : ""}
          </p>
        )}
        {annotation && (
          <p className="text-xs text-muted-foreground mt-1 text-right">{annotation}</p>
        )}
        {allLinks.length > 0 && (
          <Accordion type="single" collapsible className="mt-2 border-t border-border">
            <AccordionItem value="links" className="border-none">
              <AccordionTrigger className="pt-2 pb-1 text-xs text-muted-foreground hover:no-underline">
                関連ランキング（{allLinks.length}件）
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {allLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      className="text-xs text-primary hover:underline"
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
  </div>
  );
};
