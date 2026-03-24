import React from "react";
import { ReelLastPage, type ThemeName } from "@/shared";

interface ReelLastPagePreviewProps {
  theme?: ThemeName;
}

export const ReelLastPagePreview: React.FC<ReelLastPagePreviewProps> = ({
  theme = "dark",
}) => {
  return <ReelLastPage theme={theme} />;
};
