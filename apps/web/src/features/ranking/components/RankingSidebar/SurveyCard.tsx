import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { isOk } from "@stats47/types";
import { listSurveys } from "@stats47/ranking/server";

interface SurveyCardProps {
  /** 現在表示中のランキングの調査ID（ハイライト用） */
  currentSurveyId?: string;
}

export async function SurveyCard({ currentSurveyId }: SurveyCardProps) {
  const result = await listSurveys();
  const surveys = isOk(result) ? result.data : [];

  if (surveys.length === 0) return null;

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
          {surveys.map((survey) => (
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
      </CardContent>
    </Card>
  );
}
