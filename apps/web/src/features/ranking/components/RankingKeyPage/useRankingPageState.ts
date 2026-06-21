"use client";

import { useEffect, useState, useTransition } from "react";

import { usePathname } from "next/navigation";

import { isOk } from "@stats47/types";

import type { AreaType } from "@/features/area";

import { trackAreaTypeChange, trackRankingView, trackYearChange } from "@/lib/analytics/events";

import { fetchRankingValuesAction } from "../../actions/fetch-ranking-values";

import type { RankingItem, RankingValue } from "@stats47/ranking";

interface UseRankingPageStateParams {
    rankingKey: string;
    rankingItem: RankingItem;
    initialRankingValues: RankingValue[];
    areaType: AreaType;
    selectedYear?: string;
    parentAreaCode?: string;
    cityRankingItem?: RankingItem;
}

export function useRankingPageState({
    rankingKey,
    rankingItem,
    initialRankingValues,
    areaType,
    selectedYear,
    parentAreaCode,
    cityRankingItem,
}: UseRankingPageStateParams) {
    const [rankingValues, setRankingValues] = useState<RankingValue[]>(initialRankingValues);
    const [currentYear, setCurrentYear] = useState(selectedYear ?? "");
    const [normalizationType, setNormalizationType] = useState<string | undefined>(undefined);
    const [currentAreaType, setCurrentAreaType] = useState<AreaType>(areaType);
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();

    const activeRankingItem = currentAreaType === "city" && cityRankingItem
        ? cityRankingItem
        : rankingItem;

    const buildUrl = (year: string, area: AreaType, norm?: string) => {
        const params = new URLSearchParams();
        if (year) params.set("year", year);
        if (area !== "prefecture") params.set("areaType", area);
        if (norm) params.set("norm", norm);
        const qs = params.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    };

    useEffect(() => {
        trackRankingView({
            rankingKey,
            title: rankingItem.title,
            categoryKey: rankingItem.categoryKey,
            areaType: currentAreaType,
            yearCode: currentYear,
        });
    }, [rankingKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleYearChange = (newYear: string) => {
        trackYearChange({ rankingKey, fromYear: currentYear, toYear: newYear });
        setCurrentYear(newYear);
        window.history.replaceState(null, "", buildUrl(newYear, currentAreaType, normalizationType));
        startTransition(async () => {
            const result = await fetchRankingValuesAction(
                rankingKey,
                currentAreaType,
                newYear,
                normalizationType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

    const handleAreaTypeChange = (newAreaType: AreaType) => {
        trackAreaTypeChange({ rankingKey, areaType: newAreaType });
        setCurrentAreaType(newAreaType);

        const targetItem = newAreaType === "city" && cityRankingItem
            ? cityRankingItem
            : rankingItem;
        const targetYears = targetItem.availableYears || [];
        const yearExists = targetYears.some((y) => y.yearCode === currentYear);
        const newYear = yearExists ? currentYear : (targetYears[0]?.yearCode || currentYear);
        setCurrentYear(newYear);

        window.history.replaceState(null, "", buildUrl(newYear, newAreaType));
        startTransition(async () => {
            const result = await fetchRankingValuesAction(
                rankingKey,
                newAreaType,
                newYear,
                normalizationType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlYear = params.get("year");
        const urlAreaType = params.get("areaType") as AreaType | null;
        const urlNorm = params.get("norm") ?? undefined;

        if (urlNorm) {
            setNormalizationType(urlNorm);
        }

        if (urlAreaType === "city" && cityRankingItem) {
            setCurrentAreaType("city");
            const targetYears = cityRankingItem.availableYears || [];
            const year = urlYear || targetYears[0]?.yearCode || "";
            if (year !== selectedYear || urlAreaType !== areaType) {
                setCurrentYear(year);
                startTransition(async () => {
                    const result = await fetchRankingValuesAction(rankingKey, "city", year, urlNorm, parentAreaCode);
                    if (isOk(result)) setRankingValues(result.data);
                });
            }
        } else if (urlYear && urlYear !== selectedYear) {
            setCurrentYear(urlYear);
            window.history.replaceState(null, "", buildUrl(urlYear, currentAreaType, urlNorm));
            startTransition(async () => {
                const result = await fetchRankingValuesAction(
                    rankingKey,
                    currentAreaType,
                    urlYear,
                    urlNorm,
                    parentAreaCode,
                );
                if (isOk(result)) setRankingValues(result.data);
            });
        } else if (urlNorm) {
            startTransition(async () => {
                if (!currentYear) return;
                const result = await fetchRankingValuesAction(
                    rankingKey,
                    currentAreaType,
                    currentYear,
                    urlNorm,
                    parentAreaCode,
                );
                if (isOk(result)) setRankingValues(result.data);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNormalizationChange = (value: string) => {
        const nextType = value === "original" ? undefined : value;
        setNormalizationType(nextType);

        const params = new URLSearchParams(window.location.search);
        if (nextType) {
            params.set("norm", nextType);
        } else {
            params.delete("norm");
        }
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);

        startTransition(async () => {
            if (!currentYear) return;
            const result = await fetchRankingValuesAction(
                rankingKey,
                currentAreaType,
                currentYear,
                nextType,
                parentAreaCode,
            );
            if (isOk(result)) {
                setRankingValues(result.data);
            }
        });
    };

    return {
        activeRankingItem,
        currentAreaType,
        currentYear,
        handleAreaTypeChange,
        handleNormalizationChange,
        handleYearChange,
        isPending,
        normalizationType,
        rankingValues,
    };
}
