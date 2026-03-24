import React from "react";
import { type ThemeName } from "@/shared";
import { DefaultOgpDashboard } from "../DefaultOgpDashboard";

interface DefaultOgpDashboardPreviewProps {
    theme?: ThemeName;
    title?: string;
    subtitle?: string;
    showGuides?: boolean;
}

export const DefaultOgpDashboardPreview: React.FC<DefaultOgpDashboardPreviewProps> = ({
    theme = "dark",
    title,
    subtitle,
    showGuides = false,
}) => {
    return (
        <DefaultOgpDashboard
            theme={theme}
            title={title}
            subtitle={subtitle}
            showGuides={showGuides}
        />
    );
};
