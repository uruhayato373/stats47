"use client";

import React, { type PropsWithChildren } from "react";

import { Card, CardContent } from "@stats47/components/atoms/ui/card";

import type { Area } from "@/features/area";

interface DashboardPageHeaderProps {
  categoryName: string;
  area: Area;
}

export const DashboardPageHeader: React.FC<
  PropsWithChildren<DashboardPageHeaderProps>
> = ({ categoryName, area, children }) => {
  const { areaName } = area;

  return (
    <Card className="border border-border shadow-sm rounded-none">
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {areaName}の{categoryName}
          </h1>
          {children && <div className="flex-shrink-0">{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
};
