"use client";

import { useState } from "react";

import { Button, buttonVariants } from "@stats47/components/atoms/ui/button";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatValueWithPrecision } from "@stats47/utils";
import { Download } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

import type { AreaType } from "@/features/area";
import { findDataProductForRanking, TrackedProductLink } from "@/features/products";

import {
  setDeclaredPurpose,
  trackContactClick,
  trackCsvDownload,
  trackCsvDownloadPurpose,
  type CsvDownloadPurpose,
} from "@/lib/analytics/events";

import { CONTACT_FORM_URL } from "@/config/site";

const PURPOSE_OPTIONS: ReadonlyArray<{ value: CsvDownloadPurpose; label: string }> = [
  { value: "work", label: "業務の資料" },
  { value: "study", label: "学習・研究" },
  { value: "media", label: "報道・執筆" },
  { value: "personal", label: "個人の関心" },
  { value: "other", label: "その他" },
];

type SurveyState = "hidden" | "asking" | "answered";

const MAP_FORMATS = [
  { format: "kml", label: "KML" },
  { format: "geojson", label: "GeoJSON" },
] as const;

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
  /** 17 分類。「業務の資料」と答えた人に、その分野のデータ集を案内するために使う */
  categoryKey?: string | null;
}

export function DataUsageCard({
  rankingKey,
  yearCount,
  normalizationType,
  hasAllBases,
  categoryKey,
}: DataUsageCardProps) {
  const workProduct = findDataProductForRanking(rankingKey, categoryKey);
  const [survey, setSurvey] = useState<SurveyState>("hidden");
  const [answer, setAnswer] = useState<CsvDownloadPurpose | null>(null);
  const yearText = yearCount && yearCount > 0 ? `${yearCount}年分の時系列を含む` : "";

  // 全基準があればまとめてDL、なければ現在の基準でDL
  const basis = hasAllBases ? "all-bases" : (normalizationType ?? "original");
  const href = `/api/ranking/${encodeURIComponent(rankingKey)}/download?format=csv&basis=${basis}`;
  // 地図は 1 系列の塗り分けなので、全基準まとめ (all-bases) ではなく表示中の基準を使う
  const mapBasis = normalizationType ?? "original";

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
        <a href={href} onClick={() => {
              trackCsvDownload({ rankingKey, yearCode: "all" });
              if (survey === "hidden") setSurvey("asking");
            }} data-slot="button" className={buttonVariants({ variant: "default", size: "sm", className: "shrink-0" })}>
            <Download className="h-4 w-4" />
            ダウンロード
          </a>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        地図用（最新年・都道府県の塗り分け）:{" "}
        {MAP_FORMATS.map((m, i) => (
          <span key={m.format}>
            {i > 0 && " / "}
            <a
              href={`/api/ranking/${encodeURIComponent(rankingKey)}/download?format=${m.format}&basis=${mapBasis}`}
              onClick={() => {
                trackCsvDownload({ rankingKey, yearCode: "latest", fileExtension: m.format });
                if (survey === "hidden") setSurvey("asking");
              }}
              className="text-primary underline underline-offset-2"
            >
              {m.label}
            </a>
          </span>
        ))}
        。Google マイマップ・Google Earth・QGIS で開けます。
      </p>

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
          {answer === "work" && workProduct && (
            <span className="mt-2 block">
              同じ分野の指標をまとめて資料に使う場合は、
              {workProduct.title.replace(/をお渡しします$/, "")}
              （{formatValueWithPrecision(workProduct.priceYen, 0)}円・Excel / CSV / PowerPoint）があります。{" "}
              <TrackedProductLink
                href={hrefFor("product", { slug: workProduct.slug })}
                label={`${workProduct.id}:${workProduct.title}`}
                surface="ranking_product"
                className="text-primary underline underline-offset-2"
              >
                内容と条件を確認する
              </TrackedProductLink>
            </span>
          )}
          {answer === "study" && (
            <>
              {" "}レポートや論文で使うときは、このページの出典欄にある調査名と、加工した場合は「stats47 にて加工」を出典に書いてください。
            </>
          )}
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
