"use server";

import { findCorrelationPair } from "@stats47/correlation/server";

export interface CorrelationPairResult {
    pearsonR: number;
    partialRPopulation: number | null;
    partialRArea: number | null;
    partialRAging: number | null;
    partialRDensity: number | null;
    scatterData: Array<{
        areaCode: string;
        areaName: string;
        x: number;
        y: number;
    }>;
}

export async function fetchCorrelationPairAction(
    rankingKeyX: string,
    rankingKeyY: string
): Promise<CorrelationPairResult | null> {
    const result = await findCorrelationPair(rankingKeyX, rankingKeyY);

    if (!result.success || !result.data) {
        return null;
    }

    return result.data;
}
