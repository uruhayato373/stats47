"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";
import { Card, CardContent } from "@stats47/components/atoms/ui/card";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

import { getSlideSet } from "../../../data/slides";

import type { DashboardItemProps, SlideData } from "../../../types";

export const SlidePresentation: React.FC<
  DashboardItemProps<"slide-presentation">
> = ({ config }) => {
  const slides = getSlideSet(config.slideSetKey);

  if (!slides || slides.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          スライドデータが見つかりません: {config.slideSetKey}
        </CardContent>
      </Card>
    );
  }

  return <SlidePlayer slides={slides} aspectRatio={config.aspectRatio} />;
};

const DEFAULT_ASPECT_RATIO = "16/9";

function SlidePlayer({ slides, aspectRatio }: { slides: SlideData[]; aspectRatio?: string }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = useCallback(
    () => setCurrentSlide((s) => (s + 1) % slides.length),
    [slides.length]
  );
  const prev = useCallback(
    () => setCurrentSlide((s) => (s - 1 + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  const slide = slides[currentSlide];

  return (
    <Card className="overflow-hidden">
      {/* アクセントバー */}
      <div
        className={`h-1.5 ${slide.accent} transition-colors duration-500`}
      />

      <CardContent className="p-0">
        <div
          className="relative flex flex-col p-6 sm:p-10"
          style={{ aspectRatio: aspectRatio || DEFAULT_ASPECT_RATIO }}
        >
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white ${slide.accent} transition-colors duration-500`}
              >
                {slide.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-3 leading-tight">
                {slide.title}
              </h2>
              <p className="text-muted-foreground font-medium text-sm mt-1">
                {slide.subtitle}
              </p>
            </div>
            <BookOpen className="h-12 w-12 text-muted-foreground/50 shrink-0 hidden sm:block" />
          </div>

          {/* コンテンツ */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl">{slide.content}</div>
          </div>

          {/* フッター */}
          <div className="mt-6 pt-4 border-t border-border flex justify-between items-end">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                {slide.id}
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                Visual Guide
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/50 font-medium">
              Source: 総務省
            </div>
          </div>

          {/* ナビゲーションボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-md border border-border h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-md border border-border h-9 w-9"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* ドットインジケータ */}
        <div className="flex justify-center gap-2 pb-4">
          {slides.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(slides.indexOf(s))}
              className={`h-2 rounded-full transition-all ${
                slides.indexOf(s) === currentSlide
                  ? "w-8 bg-blue-600"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
