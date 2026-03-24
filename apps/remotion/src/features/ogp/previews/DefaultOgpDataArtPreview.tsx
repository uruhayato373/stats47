import React from "react";
import { type ThemeName } from "@/shared";
import { DefaultOgpDataArt } from "../DefaultOgpDataArt";

interface DefaultOgpDataArtPreviewProps {
    theme?: ThemeName;
    title?: string;
    subtitle?: string;
    showGuides?: boolean;
}

export const DefaultOgpDataArtPreview: React.FC<DefaultOgpDataArtPreviewProps> = ({
    theme = "dark",
    title,
    subtitle,
    showGuides = false,
}) => {
    return (
        <DefaultOgpDataArt
            theme={theme}
            title={title}
            subtitle={subtitle}
            showGuides={showGuides}
        />
    );
};
