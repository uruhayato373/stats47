"use client";

import { useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";
import { Download } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

import type { AreaType } from "@/features/area";

import {
  setDeclaredPurpose,
  trackContactClick,
  trackCsvDownload,
  trackCsvDownloadPurpose,
  type CsvDownloadPurpose,
} from "@/lib/analytics/events";

const CONTACT_FORM_URL = "https://forms.gle/ZYi7Rmk4Kt9qZCXB8";

const PURPOSE_OPTIONS: ReadonlyArray<{ value: CsvDownloadPurpose; label: string }> = [
  { value: "work", label: "業務の資料" },
  { value: "study", label: "学習・研究" },
  { value: "media", label: "報道・執筆" },
  { value: "personal", label: "個人の関心" },
  { value: "other", label: "その他" },
];

type SurveyState = "hidden" | "asking" | "answered";

interface DataUsageCardProps {
  rankingKey: string;
  areaType: AreaType;
  displayInfo: {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
  };
  yearCount?: number;
  normalizationType?: string;
  hasAllBases?: boolean;
}

export function DataUsageCard({
  rankingKey,
  yearCount,
  normalizationType,
  hasAllBases,
}: DataUsageCardProps) {
  const [survey, setSurvey] = useState<SurveyState>("hidden");
  const [answer, setAnswer] = useState<CsvDownloadPurpose | null>(null);
  const yearText = yearCount && yearCount > 0 ? `${yearCount}年分の時系列を含む` : "";

  // 全基準があればまとめてDL、なければ現在の基準でDL
  const basis = hasAllBases ? "all-bases" : (normalizationType ?? "original");
  const href = `/api/ranking/${encodeURIComponent(rankingKey)}/download?format=csv&basis=${basis}`;

  const handleAnswer = (purpose: CsvDownloadPurpose) => {
    trackCsvDownloadPurpose({ rankingKey, purpose });
    setDeclaredPurpose(purpose);
    setAnswer(purpose);
    setSurvey("answered");
  };

  return (
    <SurfaceCard className="border-primary/20 bg-primary/5">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-primary">このデータを使う</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            47都道府県{yearText ? ` × ${yearText}` : "の"}データをCSVでダウンロード。クレジット表記すれば無料で商用利用できます。
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5 shrink-0"
          asChild
        >
          <a
            href={href}
            onClick={() => {
              trackCsvDownload({ rankingKey, yearCode: "all" });
              if (survey === "hidden") setSurvey("asking");
            }}
          >
            <Download className="h-4 w-4" />
            ダウンロード
          </a>
        </Button>
      </div>

      {survey === "asking" && (
        <div className="mt-3 border-t border-primary/20 pt-3">
          <p className="text-sm text-foreground">
            よろしければ用途を教えてください（任意・匿名）
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PURPOSE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleAnswer(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSurvey("answered")}>
              答えない
            </Button>
          </div>
        </div>
      )}

      {survey === "answered" && answer && (
        <div className="mt-3 border-t border-primary/20 pt-3 text-sm text-muted-foreground">
          ご回答ありがとうございます。
          {answer === "work" && (
            <>
              {" "}業務で統計を集める作業について、お話を聞かせていただける方は{" "}
              <a
                href={CONTACT_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContactClick({ source: "csv-download-survey" })}
                className="text-primary underline underline-offset-2"
              >
                お問い合わせフォーム
              </a>
              からご連絡ください。
            </>
          )}
        </div>
      )}
    </SurfaceCard>
  );
}
