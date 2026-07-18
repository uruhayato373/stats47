interface TocItem {
  sectionKey: string;
  title: string;
}

interface Props {
  items: TocItem[];
}

/**
 * 県データブックのページ内目次 (アンカー移動)。1 ページ長尺構成のナビ。
 * サーバーコンポーネント (素の <a href="#..."> でスクロール、JS 不要)。
 */
export function DatabookToc({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="このページの目次"
      className="rounded-none border border-border bg-muted/20 p-3"
    >
      <p className="mb-2 text-xs font-bold text-muted-foreground">目次</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {items.map((item) => (
          <li key={item.sectionKey}>
            <a
              href={`#databook-${item.sectionKey}`}
              className="text-xs text-primary hover:underline"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
