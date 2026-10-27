"use client";

import { Button } from "@stats47/components/atoms/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@stats47/components/atoms/ui/tooltip";
import { Check, Facebook, Link as LinkIcon, MessageCircle } from "lucide-react";

import { trackShare } from "@/lib/analytics/events";

import { useClipboard } from "./hooks/use-clipboard";
import { useShareUrl } from "./hooks/use-share-url";
import { generateShareLinks } from "./utils/generate-share-links";

interface ShareButtonsProps {
  title: string;
  url?: string;
  variant?: "simple" | "prominent";
  /** X用のカスタムシェア文（省略時はtitle + #stats47） */
  shareText?: string;
  /** 表示するプラットフォーム名でフィルタ（省略時は全表示） */
  platforms?: string[];
}

interface ShareButtonIconProps {
  name: string;
  isProminent: boolean;
}

/** X のマーク。lucide の Twitter (旧ロゴの鳥) は現行の X と別物なので自前で描く。 */
function XMarkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * シェアボタンのアイコンコンポーネント
 */
function ShareButtonIcon({ name, isProminent }: ShareButtonIconProps) {
  const iconSize = isProminent ? "size-5" : "size-4";

  switch (name) {
    case "X (Twitter)":
      return <XMarkIcon className={iconSize} />;
    case "Facebook":
      return <Facebook className={iconSize} aria-hidden="true" />;
    case "LINE":
      // 文字の「LINE」は他のアイコンより幅が広く、ボタンの中で寸法が揃わなかった。同じ大きさのアイコンにする
      return <MessageCircle className={iconSize} aria-hidden="true" />;
    case "はてなブックマーク":
      return (
        <span
          aria-hidden="true"
          className={`inline-flex ${iconSize} items-center justify-center text-xs font-bold leading-none`}
        >
          B!
        </span>
      );
    default:
      return null;
  }
}

/**
 * シェアボタンの並び。テンプレートの Button (outline・icon) を並べる。
 * prominent はブログ記事末尾などの大きい版で、各サービスの色の地を使う。
 */
export function ShareButtons({
  title,
  url,
  variant = "simple",
  shareText,
  platforms,
}: ShareButtonsProps) {
  const shareUrl = useShareUrl(url);
  const { copied, copy } = useClipboard(shareUrl);
  const isProminent = variant === "prominent";

  const allLinks = generateShareLinks(title, shareUrl, shareText);
  const shareLinks = platforms
    ? allLinks.filter((l) => platforms.includes(l.name))
    : allLinks;

  if (!shareUrl) return null;

  const size = isProminent ? "icon-lg" : "icon";

  return (
    <div className={`flex items-center ${isProminent ? "gap-3" : "gap-1"}`}>
      <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">シェア:</span>
      <TooltipProvider>
        {shareLinks.map((link) => (
          <Tooltip key={link.name}>
            <TooltipTrigger
              render={
                <Button
                  variant={isProminent ? "default" : "outline"}
                  size={size}
                  className={isProminent ? link.prominentClass : undefined}
                  onClick={() => {
                    trackShare({ method: link.name, contentType: "page" });
                    window.open(link.href, "_blank", "width=600,height=400");
                  }}
                />
              }
            >
              <ShareButtonIcon name={link.name} isProminent={isProminent} />
              <span className="sr-only">{link.name}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{link.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline" size={size} onClick={copy} />}
          >
            {copied ? (
              <Check aria-hidden="true" className={`text-positive ${isProminent ? "size-5" : "size-4"}`} />
            ) : (
              <LinkIcon aria-hidden="true" className={isProminent ? "size-5" : "size-4"} />
            )}
            <span className="sr-only">URLをコピー</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "コピーしました！" : "URLをコピー"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
