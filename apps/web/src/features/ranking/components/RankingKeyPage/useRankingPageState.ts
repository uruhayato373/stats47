"use client";

import { useEffect, useState, useTransition } from "react";

import { usePathname } from "next/navigation";

import { isOk } from "@stats47/types";

import type { AreaType } from "@/features/area";

import { trackAreaTypeChange, trackRankingView, trackYearChange } from "@/lib/analytics/events";

import { fetchNationalAverageSeriesAction } from "../../actions/fetch-national-average-series";
import { fetchRankingValuesAction } from "../../actions/fetch-ranking-values";

import type { NationalAveragePoint } from "../../lib/build-national-average-series";
import type { RankingItem, RankingValue } from "@stats47/ranking";

interface UseRankingPageStateParams {
    rankingKey: string;
    rankingItem: RankingItem;
    initialRankingValues: RankingValue[];
    /** サーバーが全年 values から畳んだ総数ベースの全国平均系列 */
    initialNationalAverageSeries: NationalAveragePoint[];
    areaType: AreaType;
    selectedYear?: string;
    parentAreaCode?: string;
    cityRankingItem?: RankingItem;
}

export function useRankingPageState({
    rankingKey,
    rankingItem,
    initialRankingValues,
    initialNationalAverageSeries,
    areaType,
    selectedYear,
    parentAreaCode,
    cityRankingItem,
}: UseRankingPageStateParams) {
    const [rankingValues, setRankingValues] = useState<RankingValue[]>(initialRankingValues);
    const [nationalAverageSeries, setNationalAverageSeries] = useState<NationalAveragePoint[]>(
        initialNationalAverageSeries,
    );
    const [currentYear, setCurrentYear] = useState(selectedYear ?? "");
    const [normalizationType, setNormalizationType] = useState<string | undefined>(undefined);
    const [currentAreaType, setCurrentAreaType] = useState<AreaType>(areaType);
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();

    const activeRankingItem = currentAreaType === "city" && cityRankingItem
        ? cityRankingItem
        : rankingItem;

    /**
     * 計算方法に対応した全国平均系列を解決する。
     * 総数はサーバー seed をそのまま使い再取得しない (系列は年度非依存)。
     * 正規化版スナップショットが無い指標は空配列 = 推移非表示に degrade する。
     */
    const resolveSeries = async (
        area: AreaType,
        norm?: string,
    ): Promise<NationalAveragePoint[]> => {
        if (!norm) return initialNationalAverageSeries;
        const result = await fetchNationalAverageSeriesAction(rankingKey, area, norm);
        return isOk(result) ? result.data : [];
    };

    /**
     * 値と系列を 1 つの transition でまとめて差し替える。
     * 別々に setState すると「数値=10万人あたり / 線=総数」の中間フレームが出る。
     */
    const applyValuesAndSeries = async (
        area: AreaType,
        year: string,
        norm: string | undefined,
        { syncSeries }: { syncSeries: boolean },
    ) => {
        const [valuesResult, series] = await Promise.all([
            fetchRankingValuesAction(rankingKey, area, year, norm, parentAreaCode),
            syncSeries ? resolveSeries(area, norm) : Promise.resolve(null),
        ]);
        if (isOk(valuesResult)) setRankingValues(valuesResult.data);
        if (series !== null) setNationalAverageSeries(series);
    };

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
            // 系列は年度非依存なので再取得しない
            await applyValuesAndSeries(currentAreaType, newYear, normalizationType, {
                syncSeries: false,
            });
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
            await applyValuesAndSeries(newAreaType, newYear, normalizationType, {
                syncSeries: true,
            });
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
                    await applyValuesAndSeries("city", year, urlNorm, { syncSeries: true });
                });
            }
        } else if (urlYear && urlYear !== selectedYear) {
            setCurrentYear(urlYear);
            window.history.replaceState(null, "", buildUrl(urlYear, currentAreaType, urlNorm));
            startTransition(async () => {
                await applyValuesAndSeries(currentAreaType, urlYear, urlNorm, {
                    syncSeries: Boolean(urlNorm),
                });
            });
        } else if (urlNorm) {
            startTransition(async () => {
                if (!currentYear) return;
                await applyValuesAndSeries(currentAreaType, currentYear, urlNorm, {
                    syncSeries: true,
                });
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
            await applyValuesAndSeries(currentAreaType, currentYear, nextType, {
                syncSeries: true,
            });
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
        nationalAverageSeries,
        normalizationType,
        rankingValues,
    };
}
