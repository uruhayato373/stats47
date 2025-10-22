"use client";

import { Card, CardContent, CardHeader } from "@/components/molecules/ui/card";
import { Badge } from "@/components/atoms/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/molecules/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricsCard() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-border">
        <h2 className="font-medium text-foreground">
          Analytics
        </h2>
        <Select defaultValue="30">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="期間を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="24">Last 24 hours</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="block font-medium text-xl text-foreground">
              22,900
            </span>
            <Badge variant="default" className="w-fit">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5%
            </Badge>
          </div>

          <div className="flex flex-col">
            <span className="block font-medium text-xl text-foreground">
              8,430
            </span>
            <Badge variant="destructive" className="w-fit">
              <TrendingDown className="w-3 h-3 mr-1" />
              -2.1%
            </Badge>
          </div>
        </div>

        <div className="mt-4 h-64 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">
            Chart Placeholder
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
