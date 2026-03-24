"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Input } from "@stats47/components/atoms/ui/input";
import { cn } from "@stats47/components";

interface CityItem {
  cityCode: string;
  cityName: string;
}

interface CityListSidebarClientProps {
  prefName: string;
  cities: CityItem[];
  currentAreaCode: string;
  basePath: string;
}

export function CityListSidebarClient({
  prefName,
  cities,
  currentAreaCode,
  basePath,
}: CityListSidebarClientProps) {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    if (!search) return cities;
    return cities.filter((c) => c.cityName.includes(search));
  }, [cities, search]);

  return (
    <Card className="w-full border border-border shadow-sm rounded-sm overflow-hidden animate-in fade-in duration-500">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-base">{prefName}の市区町村</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <Input
          placeholder="市区町村を検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
        <nav className="max-h-[60vh] overflow-y-auto space-y-1">
          {filteredCities.map((city) => {
            const isActive = city.cityCode === currentAreaCode;
            const displayName = city.cityName.replace(prefName, "");
            return (
              <Link
                key={city.cityCode}
                href={`${basePath}/${city.cityCode}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border border-primary bg-primary/5 font-medium"
                    : "hover:bg-accent/50"
                )}
              >
                {displayName}
              </Link>
            );
          })}
          {filteredCities.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              該当する市区町村がありません
            </p>
          )}
        </nav>
      </CardContent>
    </Card>
  );
}
