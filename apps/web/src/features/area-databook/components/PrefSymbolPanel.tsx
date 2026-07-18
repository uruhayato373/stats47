import { getSurfaceCardClassName } from "@/components/surface";

import type { AreaEditorial } from "@stats47/data-configs";


interface Props {
  editorial: AreaEditorial | null;
}

const LABELS: { key: keyof AreaEditorial["symbols"]; label: string }[] = [
  { key: "tree", label: "木" },
  { key: "flower", label: "花" },
  { key: "bird", label: "鳥" },
  { key: "fish", label: "魚" },
  { key: "animal", label: "獣" },
  { key: "song", label: "歌" },
];

/**
 * 県のシンボル (木/花/鳥/魚/歌)。editorial (git TS) を直接描画する。
 * 出典は県公式 (editorial.symbols.sourceUrl)。
 */
export function PrefSymbolPanel({ editorial }: Props) {
  if (!editorial) return null;
  const { symbols } = editorial;
  const rows = LABELS.filter((l) => symbols[l.key]);

  return (
    <div>
      <dl className="grid grid-cols-2 gap-2 @container @sm:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.key}
            className={getSurfaceCardClassName({
              className: "flex items-baseline gap-2 px-3 py-2",
            })}
          >
            <dt className="text-xs font-medium text-muted-foreground">県の{r.label}</dt>
            <dd className="text-sm font-bold text-foreground">{symbols[r.key]}</dd>
          </div>
        ))}
      </dl>
      <a
        href={symbols.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-[10px] text-primary hover:underline"
      >
        出典
      </a>
    </div>
  );
}
