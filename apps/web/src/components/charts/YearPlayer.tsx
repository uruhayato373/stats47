'use client';

import { useEffect, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { Slider } from '@stats47/components/atoms/ui/slider';
import { Pause, Play } from 'lucide-react';

/** 再生時の 1 年あたりの間隔 (ms) */
const PLAY_INTERVAL_MS = 280;

export interface YearPlayback {
  first: number;
  last: number;
  year: number;
  isPlaying: boolean;
  setYear: (year: number) => void;
  togglePlay: () => void;
}

/** 年の再生の状態。最初は最後の年を表示し、再生すると 1 年ずつ進めて最後の年で止まる */
export function useYearPlayback(first: number, last: number): YearPlayback {
  const [year, setYearState] = useState(last);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setYearState((current) => {
        if (current >= last) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, last]);

  return {
    first,
    last,
    year,
    isPlaying,
    // スライダーを動かしたら再生を止める
    setYear: (value) => {
      setIsPlaying(false);
      setYearState(value);
    },
    togglePlay: () => {
      if (isPlaying) {
        setIsPlaying(false);
        return;
      }
      if (year >= last) setYearState(first);
      setIsPlaying(true);
    },
  };
}

/** 年の再生ボタンとスライダー。地図や図の年を 1 年ずつ動かす (交通網の変遷・主題の地図で共用) */
export function YearPlayer({ playback }: { playback: YearPlayback }) {
  const { first, last, year, isPlaying, setYear, togglePlay } = playback;
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={togglePlay}
        aria-label={isPlaying ? '再生を止める' : `${first}年から再生する`}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <Slider
        min={first}
        max={last}
        step={1}
        value={year}
        onValueChange={(value) => setYear(Array.isArray(value) ? value[0] : value)}
        aria-label="表示する年"
        className="flex-1"
      />
    </div>
  );
}
