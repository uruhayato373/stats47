import type { ReactNode } from "react";

interface HeroShellProps {
  variant?: "dark" | "light";
  children: ReactNode;
  className?: string;
}

/**
 * D-System ヒーローシェル（暗色グラデーション or 明色ライトトーン）
 *
 * - `dark`: 暗色グラデーション (slate-900 → blue-800 → blue-600)。home/area/category 等で使用
 * - `light`: 明色ライトトーン。ranking 詳細など、表ファーストなページで使用
 *
 * 内部に左右 2 カラムを置く想定だが、子要素の組み方は呼び出し側に委ねる。
 */
export function HeroShell({
  variant = "dark",
  children,
  className = "",
}: HeroShellProps) {
  if (variant === "dark") {
    return (
      <div
        className={
          "relative overflow-hidden rounded-2xl text-white shadow-sm " + className
        }
        style={{
          background:
            "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(circle at 80% 30%, #ffffff, transparent 50%)",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-border shadow-sm " +
        className
      }
      style={{
        background: "linear-gradient(160deg, #f5f8ff 0%, #ffffff 60%)",
      }}
    >
      {children}
    </div>
  );
}
