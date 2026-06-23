"use client";

/**
 * ランキング詳細ヒーローの右カラム「暗色 KPI 面」。
 *
 * 意図的な暗色 variant（bg-slate-900 + 大数値 + glow）として維持する presentational 子。
 * PageHeader の aside スロットへ渡して 2 カラム合成する（白基調の PageHeader 本体は不変）。
 */

interface StatItem {
  label: string;
  stat?: { num: string; suffix: string } | null;
  text?: string;
  suffixName?: string | null;
  show: boolean;
}

interface RankingHeroStatProps {
  topAreaName?: string | null;
  yearName?: string | null;
  topStat: { num: string; suffix: string } | null;
  statItems: StatItem[];
}

export function RankingHeroStat({
  topAreaName,
  yearName,
  topStat,
  statItems,
}: RankingHeroStatProps) {
  return (
    <div className="relative flex flex-col justify-between gap-3.5 overflow-hidden rounded-lg bg-slate-900 p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-normal text-white/65">1位</p>
          <p className="mt-0.5 text-2xl font-extrabold text-white">
            {topAreaName ?? "—"}
          </p>
        </div>
        {yearName && (
          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {yearName}
          </span>
        )}
      </div>

      <div className="font-mono tabular-nums leading-none">
        {topStat ? (
          <span className="text-[56px] font-extrabold">
            {topStat.num}
            <span className="ml-1 text-xl text-white/80">{topStat.suffix}</span>
          </span>
        ) : (
          <span className="text-[56px] font-extrabold text-white/40">—</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {statItems.map((item) => (
          <div key={item.label}>
            <p className="text-[10.5px] tracking-normal text-white/60">{item.label}</p>
            {item.text ? (
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">
                {item.text}
              </p>
            ) : item.show && item.stat ? (
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">
                {item.suffixName ? `${item.suffixName} ` : ""}
                {item.stat.num}
                {item.stat.suffix}
              </p>
            ) : (
              <p className="mt-0.5 font-mono text-sm font-bold text-white/40">—</p>
            )}
          </div>
        ))}
      </div>

      {/* glow 装飾 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)",
        }}
      />
    </div>
  );
}
