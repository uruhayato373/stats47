"use client";

import { Button } from "@stats47/components/atoms/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@stats47/components/atoms/ui/tooltip";
import { Check, Facebook, Link as LinkIcon, Twitter } from "lucide-react";

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

/**
 * シェアボタンのアイコンコンポーネント
 */
function ShareButtonIcon({ name, isProminent }: ShareButtonIconProps) {
  const iconSize = isProminent ? "h-5 w-5" : "h-4 w-4";
  const textSize = isProminent ? "text-sm" : "text-[10px]";

  const content = (() => {
    switch (name) {
      case "X (Twitter)":
        return <Twitter className={iconSize} />;
      case "Facebook":
        return <Facebook className={iconSize} />;
      case "LINE":
        return <span className={`font-bold ${textSize} leading-none`}>LINE</span>;
      case "はてなブックマーク":
        return (
          <span
            className={`font-bold ${textSize} leading-none`}
            style={{ fontFamily: "Verdana, sans-serif" }}
          >
            B!
          </span>
        );
      default:
        return null;
    }
  })();

  return (
    <span className="flex items-center justify-center w-full h-full">
      {content}
    </span>
  );
}

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

  return (
    <div className={`flex items-center ${isProminent ? "gap-3" : "gap-1"}`}>
      <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">シェア:</span>
      <TooltipProvider>
        {shareLinks.map((link) => (
          <Tooltip key={link.name}>
            <TooltipTrigger asChild>
              <Button
                variant={isProminent ? "default" : "ghost"}
                size={isProminent ? "default" : "icon"}
                className={`rounded-full transition-all ${isProminent
                  ? `h-10 w-10 p-0 shadow-sm ${link.prominentClass}`
                  : `h-8 w-8 ${link.color}`
                  }`}
                onClick={() => {
                  trackShare({ method: link.name, contentType: "page" });
                  window.open(link.href, "_blank", "width=600,height=400");
                }}
              >
                <ShareButtonIcon name={link.name} isProminent={isProminent} />
                <span className="sr-only">{link.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{link.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isProminent ? "outline" : "ghost"}
              size={isProminent ? "default" : "icon"}
              className={`rounded-full transition-all ${isProminent
                ? "h-10 w-10 p-0 border-muted-foreground/20 hover:bg-muted"
                : "h-8 w-8 hover:bg-muted"
                }`}
              onClick={copy}
            >
              <span className="flex items-center justify-center w-full h-full">
                {copied ? (
                  <Check
                    className={`text-green-500 ${isProminent ? "h-5 w-5" : "h-4 w-4"
                      }`}
                  />
                ) : (
                  <LinkIcon className={isProminent ? "h-5 w-5" : "h-4 w-4"} />
                )}
              </span>
              <span className="sr-only">URLをコピー</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "コピーしました！" : "URLをコピー"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
