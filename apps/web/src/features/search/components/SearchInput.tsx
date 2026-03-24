"use client";

import { useCallback, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";
import { Input } from "@stats47/components/atoms/ui/input";
import { Search, X } from "lucide-react";

interface SearchInputProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    defaultValue?: string;
}

/**
 * 検索入力コンポーネント
 */
export function SearchInput({
    onSearch,
    placeholder = "検索...",
    defaultValue = "",
}: SearchInputProps) {
    const [value, setValue] = useState(defaultValue);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSearch(value.trim());
        },
        [value, onSearch]
    );

    const handleClear = useCallback(() => {
        setValue("");
        onSearch("");
    }, [onSearch]);

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="h-12 pl-10 pr-24 text-base"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <Button type="submit" className="absolute right-1 top-1 bottom-1">
                    検索
                </Button>
            </div>
        </form>
    );
}
