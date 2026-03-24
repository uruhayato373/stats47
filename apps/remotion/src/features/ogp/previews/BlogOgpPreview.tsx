import { type ThemeName } from "@/shared";
import { previewDataBlog } from "@/utils/preview-data-blog";
import { BlogOgp } from "../BlogOgp";
import React from "react";

interface BlogOgpPreviewProps {
  title?: string;
  subtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
}

export const BlogOgpPreview: React.FC<BlogOgpPreviewProps> = ({
  title = previewDataBlog.title,
  subtitle = previewDataBlog.subtitle,
  theme = "light",
  showGuides = false,
}) => {
  return (
    <BlogOgp
      title={title}
      subtitle={subtitle}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
