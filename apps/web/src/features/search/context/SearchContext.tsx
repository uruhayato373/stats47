"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

import { logger } from "@/lib/logger";

import { searchDocuments } from "../lib/search-client";
import type {
    SearchOptions,
    SearchResponse,
} from "../types/search.types";

interface SearchContextValue {
    isLoading: boolean;
    search: (query: string, options?: SearchOptions) => Promise<SearchResponse>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
    children: ReactNode;
}

/**
 * 検索プロバイダー（MiniSearch クライアント検索）
 */
export function SearchProvider({ children }: SearchProviderProps) {
    const [isLoading, setIsLoading] = useState(false);

    const search = useCallback(
        async (query: string, options?: SearchOptions): Promise<SearchResponse> => {
            setIsLoading(true);
            try {
                const response = await searchDocuments(query, options);
                return response;
            } catch (error) {
                logger.error(
                    {
                        err:
                            error instanceof Error
                                ? { message: error.message, stack: error.stack }
                                : error,
                        query,
                    },
                    "検索に失敗しました"
                );
                return {
                    results: [],
                    total: 0,
                    query,
                    options,
                };
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return (
        <SearchContext.Provider value={{ isLoading, search }}>
            {children}
        </SearchContext.Provider>
    );
}

/**
 * 検索コンテキストを使用するフック
 */
export function useSearch(): SearchContextValue {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
