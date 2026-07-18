/**
 * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。
 *
 * ⚠️ AUTO-GENERATED — DO NOT EDIT.
 * 生成: npx tsx packages/data-configs/scripts/generate-editorial-index.ts
 * 県別ファイル editorial/<code>.ts を追加後に再生成する。
 * 規約: .claude/rules/area-databook-standards.md
 */
import type { AreaEditorial } from "../types";
import { HOKKAIDO_EDITORIAL } from "./01000";
import { AOMORI_EDITORIAL } from "./02000";
import { IWATE_EDITORIAL } from "./03000";
import { MIYAGI_EDITORIAL } from "./04000";
import { AKITA_EDITORIAL } from "./05000";
import { YAMAGATA_EDITORIAL } from "./06000";
import { FUKUSHIMA_EDITORIAL } from "./07000";
import { IBARAKI_EDITORIAL } from "./08000";
import { TOCHIGI_EDITORIAL } from "./09000";
import { GUNMA_EDITORIAL } from "./10000";
import { SAITAMA_EDITORIAL } from "./11000";
import { CHIBA_EDITORIAL } from "./12000";
import { TOKYO_EDITORIAL } from "./13000";
import { KANAGAWA_EDITORIAL } from "./14000";
import { NIIGATA_EDITORIAL } from "./15000";
import { TOYAMA_EDITORIAL } from "./16000";
import { ISHIKAWA_EDITORIAL } from "./17000";
import { FUKUI_EDITORIAL } from "./18000";
import { YAMANASHI_EDITORIAL } from "./19000";
import { NAGANO_EDITORIAL } from "./20000";
import { GIFU_EDITORIAL } from "./21000";
import { SHIZUOKA_EDITORIAL } from "./22000";
import { AICHI_EDITORIAL } from "./23000";
import { MIE_EDITORIAL } from "./24000";
import { SHIGA_EDITORIAL } from "./25000";
import { KYOTO_EDITORIAL } from "./26000";
import { OSAKA_EDITORIAL } from "./27000";
import { HYOGO_EDITORIAL } from "./28000";
import { NARA_EDITORIAL } from "./29000";
import { WAKAYAMA_EDITORIAL } from "./30000";
import { TOTTORI_EDITORIAL } from "./31000";
import { SHIMANE_EDITORIAL } from "./32000";
import { OKAYAMA_EDITORIAL } from "./33000";
import { HIROSHIMA_EDITORIAL } from "./34000";
import { YAMAGUCHI_EDITORIAL } from "./35000";
import { TOKUSHIMA_EDITORIAL } from "./36000";
import { KAGAWA_EDITORIAL } from "./37000";
import { EHIME_EDITORIAL } from "./38000";
import { KOCHI_EDITORIAL } from "./39000";
import { FUKUOKA_EDITORIAL } from "./40000";
import { SAGA_EDITORIAL } from "./41000";
import { NAGASAKI_EDITORIAL } from "./42000";
import { KUMAMOTO_EDITORIAL } from "./43000";
import { OITA_EDITORIAL } from "./44000";
import { MIYAZAKI_EDITORIAL } from "./45000";
import { KAGOSHIMA_EDITORIAL } from "./46000";
import { OKINAWA_EDITORIAL } from "./47000";

/** 県別編集コンテンツの登録簿 (areaCode → editorial)。 */
export const AREA_EDITORIALS: Record<string, AreaEditorial> = {
  "01000": HOKKAIDO_EDITORIAL,
  "02000": AOMORI_EDITORIAL,
  "03000": IWATE_EDITORIAL,
  "04000": MIYAGI_EDITORIAL,
  "05000": AKITA_EDITORIAL,
  "06000": YAMAGATA_EDITORIAL,
  "07000": FUKUSHIMA_EDITORIAL,
  "08000": IBARAKI_EDITORIAL,
  "09000": TOCHIGI_EDITORIAL,
  "10000": GUNMA_EDITORIAL,
  "11000": SAITAMA_EDITORIAL,
  "12000": CHIBA_EDITORIAL,
  "13000": TOKYO_EDITORIAL,
  "14000": KANAGAWA_EDITORIAL,
  "15000": NIIGATA_EDITORIAL,
  "16000": TOYAMA_EDITORIAL,
  "17000": ISHIKAWA_EDITORIAL,
  "18000": FUKUI_EDITORIAL,
  "19000": YAMANASHI_EDITORIAL,
  "20000": NAGANO_EDITORIAL,
  "21000": GIFU_EDITORIAL,
  "22000": SHIZUOKA_EDITORIAL,
  "23000": AICHI_EDITORIAL,
  "24000": MIE_EDITORIAL,
  "25000": SHIGA_EDITORIAL,
  "26000": KYOTO_EDITORIAL,
  "27000": OSAKA_EDITORIAL,
  "28000": HYOGO_EDITORIAL,
  "29000": NARA_EDITORIAL,
  "30000": WAKAYAMA_EDITORIAL,
  "31000": TOTTORI_EDITORIAL,
  "32000": SHIMANE_EDITORIAL,
  "33000": OKAYAMA_EDITORIAL,
  "34000": HIROSHIMA_EDITORIAL,
  "35000": YAMAGUCHI_EDITORIAL,
  "36000": TOKUSHIMA_EDITORIAL,
  "37000": KAGAWA_EDITORIAL,
  "38000": EHIME_EDITORIAL,
  "39000": KOCHI_EDITORIAL,
  "40000": FUKUOKA_EDITORIAL,
  "41000": SAGA_EDITORIAL,
  "42000": NAGASAKI_EDITORIAL,
  "43000": KUMAMOTO_EDITORIAL,
  "44000": OITA_EDITORIAL,
  "45000": MIYAZAKI_EDITORIAL,
  "46000": KAGOSHIMA_EDITORIAL,
  "47000": OKINAWA_EDITORIAL,
};

/** 登録済み editorial 配列。 */
export function listAreaEditorials(): AreaEditorial[] {
  return Object.values(AREA_EDITORIALS);
}
