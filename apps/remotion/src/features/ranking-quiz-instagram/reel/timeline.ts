/**
 * 予想クイズ型リール (1080x1920・9:16・音声なし・fps=30) のシーン尺 SSOT。
 *
 * 「予想 → 答え合わせ」を1本にする構成:
 * フック → 選択肢 → ヒント(カウントダウン) → 正解発表 → 上位5県 → 締め。
 * 合計 540 フレーム = 18秒（15〜18秒の想定枠に収める）。
 */
export const QUIZ_REEL_FPS = 30;

export const QUIZ_REEL_SCENE_DURATION = {
  /** 0-3秒: 出題を大きく見せるフック */
  hook: 90,
  /** 3-7秒: 選択肢を1つずつ見せる */
  choices: 120,
  /** 7-10秒: ヒント（タイル地図 + 3-2-1カウントダウン） */
  hint: 90,
  /** 10-13秒: 1位の県・値を発表 */
  answer: 90,
  /** 13-16秒: 上位5県の棒グラフが伸びる */
  bars: 90,
  /** 16-18秒: 保存・プロフィール導線 */
  outro: 60,
} as const;

export type QuizReelSceneName = keyof typeof QUIZ_REEL_SCENE_DURATION;

const SCENE_ORDER: QuizReelSceneName[] = ["hook", "choices", "hint", "answer", "bars", "outro"];

export interface QuizReelSceneTiming {
  start: number;
  duration: number;
}

export type QuizReelTimeline = Record<QuizReelSceneName, QuizReelSceneTiming> & {
  totalDuration: number;
};

/** 各シーンの開始フレームを尺から積み上げる（重複・隙間を作らない） */
export function getQuizReelTimeline(): QuizReelTimeline {
  let cursor = 0;
  const timeline = {} as QuizReelTimeline;
  for (const name of SCENE_ORDER) {
    const duration = QUIZ_REEL_SCENE_DURATION[name];
    timeline[name] = { start: cursor, duration };
    cursor += duration;
  }
  timeline.totalDuration = cursor;
  return timeline;
}
