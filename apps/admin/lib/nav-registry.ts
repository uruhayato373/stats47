/**
 * 左サイドメニューの唯一の定義 (SSOT) と、現在地の判定。React に依存しない純モジュール
 * (Nav の表示部品と、ルート実在を確かめるテストの両方が import する。doboku-note admin-app の channel-registry と同じ考え方)。
 * グループと並びは領域の正本 (.claude/config/domains.json) から作る。URL を変えたら tests/unit/nav-registry.test.ts が「ルートが実在するか」で止める。
 */

import domainsConfig from "../../../.claude/config/domains.json";

import { channelsOf, type ChannelGroup } from "./channel-registry";

export type NavItem = { href: string; label: string };
/** 折りたたみの第二階層 (公式 SidebarMenuSub)。現在地を含む枝だけ開いて表示する */
export type NavBranch = { label: string; children: readonly NavItem[] };
export type NavEntry = NavItem | NavBranch;
export type NavGroup = { title: string | null; items: readonly NavEntry[] };

export function isBranch(entry: NavEntry): entry is NavBranch {
  return "children" in entry;
}

/** チャネル別の枝。中身は channel-registry.ts から作り、ここにチャネル名を直書きしない */
function channelBranch(group: ChannelGroup): NavBranch {
  return { label: "チャネル別", children: channelsOf(group).map(({ href, label }) => ({ href, label })) };
}

type DomainNavEntry = { label: string; kind: string } & ({ href: string } | { channels: ChannelGroup });
type Domain = { id: string; label: string; role: string; nav: readonly DomainNavEntry[] };

/**
 * グループ = 領域。並び・見出し・項目は領域の正本 `.claude/config/domains.json` から作り、ここに直書きしない
 * (役割の順: 決める → 売る → 集める → つくる → 支える。検査は `npm run check-domains`)。
 * チャネルは最上位に並べず、商品・SNS の「チャネル別」の枝に入れる。
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  { title: null, items: [{ href: "/", label: "ホーム" }] },
  ...(domainsConfig.domains as readonly Domain[]).map((d) => ({
    title: d.label,
    items: d.nav.map((n): NavEntry => ("channels" in n ? channelBranch(n.channels) : { href: n.href, label: n.label })),
  })),
];

/** 枝の中まで含めた全項目の href (現在地の親子判定とテストが使う) */
export function navHrefs(groups: readonly NavGroup[]): string[] {
  return groups.flatMap((g) => g.items.flatMap((e) => (isBranch(e) ? e.children.map((c) => c.href) : [e.href])));
}

const TODO_LAYERS =new Set(["weekly", "monthly", "improvements"]);

/**
 * ルート以外は前方一致。TODO だけは同じ pathname 内の f=層まで比較する。
 * 未知の f はページ側と同じくバックログへフォールバックする。
 */
export function isActive(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
  href: string,
): boolean {
  const [path, query = ""] = href.split("?");
  if (href === "/") return pathname === "/";
  if (path === "/todo") {
    if (pathname !== "/todo") return false;
    const expectedLayer = new URLSearchParams(query).get("f");
    const currentLayer = searchParams.get("f");
    if (expectedLayer) return currentLayer === expectedLayer;
    return currentLayer === null || !TODO_LAYERS.has(currentLayer);
  }
  if (path === "/content") return pathname === "/content";
  return pathname === path || pathname.startsWith(path + "/");
}

/** 前方一致の親 (/strategy) は、より具体的な項目 (/strategy/lanes) も一致するときは譲る */
export function hasMoreSpecificMatch(pathname: string, href: string, hrefs: readonly string[]): boolean {
  const path = href.split("?")[0];
  return hrefs.some((other) => {
    const o = other.split("?")[0];
    return o.startsWith(path + "/") && (pathname === o || pathname.startsWith(o + "/"));
  });
}

/** メニュー項目が現在地か。より具体的な項目が一致するときは親 (/strategy) は譲る。 */
export function isNavItemActive(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
  href: string,
  allHrefs: readonly string[],
): boolean {
  return isActive(pathname, searchParams, href) && !hasMoreSpecificMatch(pathname, href, allHrefs);
}
