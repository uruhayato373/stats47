import React from "react";
import { type ThemeName } from "@/shared";
import { DefaultOgpMinimal } from "../DefaultOgpMinimal";

interface DefaultOgpMinimalPreviewProps {
    theme?: ThemeName;
    title?: string;
    description?: string;
    urlText?: string;
    showGuides?: boolean;
}

export const DefaultOgpMinimalPreview: React.FC<DefaultOgpMinimalPreviewProps> = ({
    theme = "light",
    title,
    description,
    urlText,
    showGuides = false,
}) => {
    return (
        <DefaultOgpMinimal
            theme={theme}
            title={title}
            description={description}
            urlText={urlText}
            showGuides={showGuides}
        />
    );
};
