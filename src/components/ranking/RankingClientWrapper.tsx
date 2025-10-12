"use client";

import React from "react";
import { RankingClient } from "@/components/ranking/RankingClient";
import { RankingClientProps } from "@/types/models/ranking";

/**
 * Client wrapper for RankingClient to handle useSession
 */
export const RankingClientWrapper = <T extends string>(
  props: RankingClientProps<T>
) => {
  return <RankingClient {...props} />;
};
