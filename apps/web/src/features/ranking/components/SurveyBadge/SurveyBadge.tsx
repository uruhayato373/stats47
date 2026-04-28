import Link from "next/link";

import { readSurveyByIdFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

interface SurveyBadgeProps {
  surveyId: string;
}

export async function SurveyBadge({ surveyId }: SurveyBadgeProps) {
  const result = await readSurveyByIdFromR2(surveyId);
  const survey = isOk(result) ? result.data : null;

  if (!survey) return null;

  return (
    <div className="mt-1.5">
      <Link
        href={`/survey/${survey.id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 hover:bg-muted px-2 py-0.5 rounded transition-colors"
      >
        <span className="text-muted-foreground/70">出典:</span>
        <span className="hover:text-primary">{survey.name}</span>
      </Link>
    </div>
  );
}
