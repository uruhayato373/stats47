/**
 * 検索ボックスコンポーネント
 * 
 * 記事検索用のUIコンポーネント
 */

"use client";

import { useState } from "react";

import { Input } from "@/components/atoms/ui/input";
import { Button } from "@/components/atoms/ui/button";
import { Search } from "lucide-react";

/**
 * 検索ボックスのプロパティ
 */
export interface SearchBoxProps {
  /** 初期検索クエリ */
  initialQuery?: string;
  /** 検索実行時のコールバック */
  onSearch?: (query: string) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 検索ボックスコンポーネント
 * 
 * 記事検索用の検索UIを提供
 */
export function SearchBox({
  initialQuery = "",
  onSearch,
  placeholder = "記事を検索...",
  className,
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit" size="default">
          <Search className="h-4 w-4 mr-2" />
          検索
        </Button>
      </div>
    </form>
  );
}

