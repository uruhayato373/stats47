/**
 * 販売チャネル (商品) と SNS チャネルの唯一の定義 (SSOT)。名前・画面・グループはここだけに書く。
 * 左メニューの「チャネル別」の枝 (nav-registry.ts) と、コンテンツ運用の集計 (content-operations/core.ts) が読む。
 * doboku-note admin-app の channel-registry と同じ考え方。CI の audit スクリプトも import するので
 * パス別名 (@/…) を使わない純モジュールにする。
 */

export type ChannelGroup = "product" | "sns";
export type ChannelId = "note" | "coconala" | "kindle" | "x" | "instagram";

export type ChannelDef = {
  id: ChannelId;
  label: string;
  /** チャネルの画面。サブ画面 (例: /content/note/covers) も前方一致でこのチャネルの現在地になる */
  href: string;
  group: ChannelGroup;
};

export const CHANNELS: readonly ChannelDef[] = [
  { id: "note", label: "note", href: "/content/note", group: "product" },
  { id: "coconala", label: "ココナラ", href: "/product/coconala", group: "product" },
  { id: "kindle", label: "Kindle", href: "/content/kindle", group: "product" },
  { id: "x", label: "X", href: "/content/x", group: "sns" },
  { id: "instagram", label: "Instagram", href: "/content/instagram", group: "sns" },
];

export function channelsOf(group: ChannelGroup): readonly ChannelDef[] {
  return CHANNELS.filter((c) => c.group === group);
}

export function channelById(id: ChannelId): ChannelDef {
  const found = CHANNELS.find((c) => c.id === id);
  if (!found) throw new Error(`unknown channel: ${id}`);
  return found;
}
