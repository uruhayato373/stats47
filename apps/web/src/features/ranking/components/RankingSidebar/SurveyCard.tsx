import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { isOk } from "@stats47/types";
import { findSurveyById } from "@stats47/ranking/server";

interface SurveyCardProps {
  surveyId: string;
}

export async function SurveyCard({ surveyId }: SurveyCardProps) {
  const result = await findSurveyById(surveyId);
  const survey = isOk(result) ? result.data : null;

  if (!survey) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          調査
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <Link
          href={`/survey/${survey.id}`}
          className="text-xs hover:text-primary transition-colors"
        >
          {survey.name}
        </Link>
        {survey.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {survey.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
