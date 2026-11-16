/**
 * 型「1県1章のガイド」(KDP-EXPANSION-01 ①・2026-11-14) の書き下ろし章の目安。
 *
 * 執筆ブリーフ (scripts/build-fresh-briefs.mts) と原稿の検査 (scripts/verify-fresh.mts) が
 * 同じ値を読む (片方だけ変えると検査が意味を失う)。県の章はファイル名が `2<n>-<県>.md`。
 */
import type { KindleBook } from "./types";

/** この型の本か (カタログの sourceIdeas で宣言する)。 */
export function isPrefectureGuide(book: Pick<KindleBook, "sourceIdeas">): boolean {
  return book.sourceIdeas?.includes("kindle:prefecture-guide") ?? false;
}

/** 書き下ろし章の目安字数と、書く内容。 */
export function prefectureGuideChapterSpec(file: string): { target: number; brief: string } | null {
  if (file === "00-intro.md") {
    return { target: 2500, brief: "読者の悩み (転勤・移住で住む県を選ぶ) から入り、この本で比べる物差しと読み方の順番を示す。観光ガイドではなく統計の本であることを明確にする。" };
  }
  if (file === "10-how-to-read.md") {
    return { target: 2000, brief: "年がそろっていない指標の扱い、県全域の値と県庁所在市の値の違い、人口当たりの指標と総数の違い、順位の上下を良し悪しと読まないこと。" };
  }
  if (/^2\d-[a-z]+\.md$/.test(file)) {
    return { target: 2400, brief: "1県1章。下の「地方の県の値」の指標から、その県に住むと何が楽で何が大変かを3〜4つの節にまとめる。同じ地方のほかの県と比べ、全国順位も添える。最後に「この県が向いている人」を1節で書く。" };
  }
  if (file === "80-by-purpose.md") {
    return { target: 3000, brief: "目的別 (家計を抑えたい・子育てを優先したい・仕事を見つけやすくしたい・家を広くしたい) に、どの指標を見ればよいかと、地方の県の並びを示す。1つの県を勧めず、判断の手順として書く。" };
  }
  if (file === "90-closing.md") {
    return { target: 1500, brief: "統計で分かることと分からないこと (治安の体感・人間関係・通勤の実際) を整理し、現地で確かめることを挙げて締める。" };
  }
  return null;
}
