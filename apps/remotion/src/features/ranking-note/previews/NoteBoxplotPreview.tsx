import React from "react";

import { RankingBoxplot } from "../../ranking-x/RankingBoxplot";
import { resolveNoteData, type NoteImageProps } from "../note-common";

/**
 * 地方別の箱ひげ図 (1200x630)。ranking-x の描画を使い、note 用に次を変える (どれも opt-in で X・Instagram の出力は変えない):
 *  - 見出しを他の 3 枚と同じ読者向け名 (displayTitle) にする
 *  - Y 軸はデータ範囲基準 ("data-min")。0 始まりにすると、最小値が 0 に近い県 (農業産出額の東京都など) の値ラベルが
 *    X 軸の地方名に重なる。代わりに軸が 0 未満へ伸びる指標がある
 *  - 桁数の多い値でも Y 軸ラベルが切れないよう左余白を広げ、目盛りをきりのよい刻みにする
 * props 欠落は例外にする (別指標のモックに落ちない)。
 */
export const NoteBoxplotPreview: React.FC<NoteImageProps> = (props) => {
  const { meta, entries, precision, max } = resolveNoteData(props);
  const longestTick = Math.round(max * 1.3).toLocaleString("ja-JP").length;
  return (
    <RankingBoxplot
      meta={{ ...meta, title: props.displayTitle ?? meta.title }}
      entries={entries}
      precision={precision}
      theme="light"
      minValueType="data-min"
      marginLeft={Math.max(50, 16 + longestTick * 9)}
      niceTicks
    />
  );
};
