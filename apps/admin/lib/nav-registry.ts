/**
 * 左サイドメニューの唯一の定義 (SSOT) と、現在地の判定。React に依存しない純モジュール
 * (Nav の表示部品と、ルート実在を確かめるテストの両方が import する。doboku-note admin-app の channel-registry と同じ考え方)。
 * 並びは見る目的でグループ化する。URL を変えたら tests/unit/nav-registry.test.ts が「ルートが実在するか」で止める。
 */

export type NavItem = { href: string; label: string };
export type NavGroup = { title: string | null; items: readonly NavItem[] };

export const NAV_GROUPS: readonly NavGroup[] = [
  { title: null, items: [{ href: "/", label: "ホーム" }] },
  {
    title: "制作・投稿",
    items: [
      { href: "/content", label: "コンテンツ運用" },
      { href: "/content/x", label: "X" },
      { href: "/content/instagram", label: "Instagram" },
      { href: "/content/note", label: "note" },
      { href: "/content/kindle", label: "Kindle" },
      { href: "/content/references", label: "参考文献管理" },
      { href: "/sns", label: "SNS" },
      { href: "/buzz-map", label: "バズ地図" },
    ],
  },
  {
    title: "資産",
    items: [
      { href: "/assets", label: "画像資産" },
      { href: "/svg", label: "SVG カタログ" },
    ],
  },
  {
    title: "戦略・収益化",
    items: [
      { href: "/strategy/lanes", label: "戦略レーン" },
      { href: "/strategy/policy", label: "共通方針" },
      { href: "/strategy", label: "方針・事業計画" },
      { href: "/research", label: "調査カタログ" },
      { href: "/revenue", label: "収益 (AdSense)" },
    ],
  },
  {
    // doboku-note の「アフィリエイト」領域と同じ 3 画面 (成果 = results / 掲載先 = inventory / 提携・案件 = actions)
    title: "アフィリエイト",
    items: [
      { href: "/affiliate", label: "成果" },
      { href: "/affiliate/placements", label: "掲載先" },
      { href: "/affiliate/programs", label: "提携・案件" },
    ],
  },
  {
    title: "品質・運用",
    items: [
      { href: "/dashboard", label: "プロジェクト現況" },
      { href: "/quality", label: "品質" },
      { href: "/ops", label: "CI・台帳" },
    ],
  },
  {
    title: "TODO",
    items: [
      { href: "/todo", label: "実行バックログ" },
      { href: "/todo?f=weekly", label: "今週の計画" },
      { href: "/todo?f=monthly", label: "今月の計画" },
      { href: "/todo?f=improvements", label: "効果測定・改善" },
    ],
  },
];

const TODO_LAYERS = new Set(["weekly", "monthly", "improvements"]);

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
