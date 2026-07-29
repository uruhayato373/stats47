/**
 * 広告スロット枠だけの最小 entrypoint。
 *
 * `./index` は `RakutenItemsCard` (→ `product-keywords`) や
 * `FurusatoNozeiCard` も export するため、枠しか要らない route まで
 * 商品辞書・都道府県判定の依存グラフを取り込んでいた。
 *
 * root barrel (`./index`) は互換性のため残す。
 */
export { InContentAdSlot, FooterAdSlot, RailAdSlot } from "./components/slots";
