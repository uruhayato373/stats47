import { redirect } from "next/navigation";

/**
 * 旧 URL。アフィリエイトの管理は doboku-note と同じ 3 画面 (成果 /affiliate・掲載先 /affiliate/placements・
 * 提携・案件 /affiliate/programs) に分けた。ブックマークと手順書の参照を壊さないよう転送だけ残す。
 */
export default function AdsRedirect() {
  redirect("/affiliate");
}
