"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const MAX_COLLAPSED = 5;

interface Survey {
  id: string;
  name: string;
}

interface SurveyCardProps {
  surveys: Survey[];
  currentSurveyId?: string;
}

export function SurveyCard({ surveys, currentSurveyId }: SurveyCardProps) {
  const isDesktop = useBreakpoint("aboveLg");
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveExpanded = isDesktop || isExpanded;

  if (surveys.length === 0) return null;

  const displaySurveys = effectiveExpanded ? surveys : surveys.slice(0, MAX_COLLAPSED);
  const hasMore = !isDesktop && surveys.length > MAX_COLLAPSED;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          調査から探す
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <nav className="flex flex-col gap-0.5">
          {displaySurveys.map((survey) => (
            <Link
              key={survey.id}
              href={`/survey/${survey.id}`}
              className={`py-1 text-xs transition-colors ${
                survey.id === currentSurveyId
                  ? "text-primary font-medium"
                  : "hover:text-primary"
              }`}
            >
              {survey.name}
            </Link>
          ))}
        </nav>
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:text-primary/80 font-medium text-center py-1 w-full transition-colors"
          >
            {isExpanded
              ? "折りたたむ"
              : `もっと見る（残り${surveys.length - MAX_COLLAPSED}件）`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
