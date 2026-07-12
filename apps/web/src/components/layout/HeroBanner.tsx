import { type ReactNode } from "react";

import Image from "next/image";

import { cn } from "@stats47/components";

interface HeroBannerProps {
  /** 文字なし hero 画像 (webp)。public 配下 or 絶対 URL */
  imageSrc: string;
  /** 画像 alt (装飾なら空文字で decorative 扱い) */
  imageAlt?: string;
  /** h1 上の小ラベル (例: "テーマ" / "カテゴリ") */
  eyebrow?: string;
  /** ページ見出し (h1)。hero 例外枠で text-2xl sm:text-3xl */
  title: string;
  /** h1 直下のタグライン (ですます調・実データ検証済みの数値のみ) */
  tagline: string;
  /** h1 群直下の操作スロット (都道府県セレクタ等) */
  actions?: ReactNode;
  /** 外側 header への追加 className */
  className?: string;
}

/**
 * 画像付きの hero 見出しバナー (共有 composite)。
 *
 * left=テキスト / right=画像 の side-by-side (モバイルは画像上・テキスト下)。
 * 見出し・タグラインは実 DOM テキストで、画像に文字を焼き込まない
 * (dark mode でも text-foreground が効く。OGP と同じ家ルール)。
 * フラット枠 (rounded-none)・トークン配色で design-system 準拠。
 * hero を出すページ (テーマ / カテゴリ) だけが使う (全ページ既定は PageHeader)。
 */
export function HeroBanner({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  tagline,
  actions,
  className,
}: HeroBannerProps) {
  return (
    <header className={cn("mb-6", className)}>
      <div className="grid grid-cols-1 overflow-hidden border border-border bg-card md:grid-cols-2">
        {/* 画像: モバイルは上、md 以上は右 */}
        <div className="relative order-1 min-h-[180px] md:order-2 md:min-h-[240px]">
          <Image
            src={imageSrc}
            alt={imageAlt ?? ""}
            fill
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover object-center dark:brightness-[0.85]"
          />
        </div>

        {/* テキスト: モバイルは下、md 以上は左 */}
        <div className="order-2 flex flex-col justify-center gap-3 p-6 md:order-1 md:p-8">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {tagline}
          </p>
          {actions && <div className="pt-1">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
