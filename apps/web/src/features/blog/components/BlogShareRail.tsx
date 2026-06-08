"use client";

import { useEffect, useState } from "react";

import { Link2, MessageCircle } from "lucide-react";

interface BlogShareRailProps {
  title: string;
  url: string;
}

export function BlogShareRail({ title, url }: BlogShareRailProps) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const absUrl = `https://stats47.jp${url}`;

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(absUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside className="hidden xl:flex flex-col items-center gap-2 sticky top-20 pt-2">
      {/* X (Twitter) */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(absUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="X でシェア"
        className="w-10 h-10 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.23H2.746l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      {/* LINE */}
      <a
        href={`https://line.me/R/msg/text/?${encodeURIComponent(title + "\n" + absUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="LINE でシェア"
        className="w-10 h-10 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors shadow-sm"
      >
        <MessageCircle size={16} />
      </a>
      {/* URL コピー */}
      <button
        onClick={handleCopy}
        title="URL をコピー"
        className="w-10 h-10 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors shadow-sm"
      >
        {copied
          ? <span className="text-[10px] font-bold text-primary">✓</span>
          : <Link2 size={16} />}
      </button>
      <div className="h-2" />
      {/* 読書進捗 % */}
      <span
        className="text-[9px] font-bold text-muted-foreground select-none"
        style={{ writingMode: "vertical-rl", letterSpacing: "0.1em" }}
      >
        READ {progress}%
      </span>
    </aside>
  );
}
