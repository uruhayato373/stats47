/**
 * 広告スロット枠だけの最小 entrypoint。
 *
 * `./index` は枠以外の部品も export するので、枠しか要らない route はここから読む。
 *
 * root barrel (`./index`) は互換性のため残す。
 */
export { InContentAdSlot, FooterAdSlot, RailAdSlot, InFeedAdSlot } from "./components/slots";
