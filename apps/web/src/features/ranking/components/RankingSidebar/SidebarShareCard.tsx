"use client";

import { Share2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ShareButtons } from "@/components/molecules/ShareButtons";

interface SidebarShareCardProps {
  title: string;
  shareText?: string;
}

export function SidebarShareCard({ title, shareText }: SidebarShareCardProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          シェアする
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 flex justify-center">
        <ShareButtons title={title} shareText={shareText} variant="prominent" />
      </CardContent>
    </Card>
  );
}
