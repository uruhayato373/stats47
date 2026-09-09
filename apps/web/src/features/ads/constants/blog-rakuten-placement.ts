import { detectSinglePrefCodeFromText } from "./furusato-nozei";
import { detectProductKeyword } from "./product-keywords";

import type { AffiliateVertical } from "./affiliate-category";

type BlogRakutenPlacement =
  | { kind: "furusato"; areaCode: string }
  | { kind: "items"; sourceText: string };

/** 記事に最大1枚。地域の食文化には返礼品、品目の比較には商品を案内する。 */
export function resolveBlogRakutenPlacement({
  title, subtitle, vertical,
}: {
  title: string;
  subtitle?: string | null;
  vertical: AffiliateVertical | null;
}): BlogRakutenPlacement | null {
  // 健康・事故・人口等の記事に、偶然含まれた品目だけで商品を勧めない。
  if (vertical !== "furusato" && vertical !== "economy" && vertical !== "travel") return null;
  // 複数調査の相関記事は家計調査が先頭でも健康・事故が主題になり得る。
  // 食品との相関から健康効果等を連想させる購買導線を作らない。
  if (/身長|体重|寿命|死亡|自殺|事故|災害|疾病|感染|中毒|アレルギー/.test(title)) return null;
  const sourceText = [title, subtitle].filter(Boolean).join("\n");
  const areaCode = detectSinglePrefCodeFromText(sourceText);
  if (areaCode && /食卓|食文化|特産品|返礼品|ふるさと納税/.test(title)) {
    return { kind: "furusato", areaCode };
  }
  if (vertical !== "travel" && detectProductKeyword(sourceText)) {
    return { kind: "items", sourceText };
  }
  return null;
}
