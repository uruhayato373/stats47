import { type ThemeName } from "@/shared";
import { previewDataBlog } from "@/utils/preview-data-blog";
import { BlogOgpGlass } from "../BlogOgpGlass";
import React from "react";

interface BlogOgpGlassPreviewProps {
  title?: string;
  subtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
}

export const BlogOgpGlassPreview: React.FC<BlogOgpGlassPreviewProps> = ({
  title = previewDataBlog.title,
  subtitle = previewDataBlog.subtitle,
  theme = "dark",
  showGuides = false,
}) => {
  return (
    <BlogOgpGlass
      title={title}
      subtitle={subtitle}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
