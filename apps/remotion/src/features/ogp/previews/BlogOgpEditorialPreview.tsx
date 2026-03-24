import { type ThemeName } from "@/shared";
import { previewDataBlog } from "@/utils/preview-data-blog";
import { BlogOgpEditorial } from "../BlogOgpEditorial";
import React from "react";

interface BlogOgpEditorialPreviewProps {
  title?: string;
  subtitle?: string;
  ogpTitle?: string;
  ogpSubtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
  hideWatermark?: boolean;
}

export const BlogOgpEditorialPreview: React.FC<BlogOgpEditorialPreviewProps> = ({
  title = previewDataBlog.title,
  subtitle = previewDataBlog.subtitle,
  ogpTitle,
  ogpSubtitle,
  theme = "light",
  showGuides = false,
  hideWatermark = false,
}) => {
  return (
    <BlogOgpEditorial
      title={title}
      subtitle={subtitle}
      ogpTitle={ogpTitle}
      ogpSubtitle={ogpSubtitle}
      theme={theme}
      showGuides={showGuides}
      hideWatermark={hideWatermark}
    />
  );
};
