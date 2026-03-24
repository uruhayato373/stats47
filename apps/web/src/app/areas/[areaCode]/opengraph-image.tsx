import { ImageResponse } from "next/og";

import { getAreaProfileAction } from "@/features/area-profile/server";

export const alt = "地域の特徴";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
    params,
}: {
    params: Promise<{ areaCode: string }>;
}) {
    const { areaCode } = await params;
    const profile = await getAreaProfileAction(areaCode);

    const areaName = profile?.areaName ?? "地域の特徴";
    const topStrengths = (profile?.strengths ?? []).slice(0, 3);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    color: "#fff",
                    fontFamily: "sans-serif",
                    padding: "60px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "24px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "80px",
                            fontWeight: 900,
                            letterSpacing: "-2px",
                            lineHeight: 1.1,
                        }}
                    >
                        {areaName}
                    </div>

                    <div
                        style={{
                            fontSize: "28px",
                            color: "#94a3b8",
                            fontWeight: 500,
                        }}
                    >
                        地域の特徴 | 統計で見る都道府県
                    </div>

                    {topStrengths.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                                marginTop: "24px",
                            }}
                        >
                            {topStrengths.map((item) => (
                                <div
                                    key={item.rankingKey}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "rgba(59, 130, 246, 0.2)",
                                        border: "1px solid rgba(59, 130, 246, 0.4)",
                                        borderRadius: "12px",
                                        padding: "12px 20px",
                                        fontSize: "22px",
                                        color: "#93c5fd",
                                    }}
                                >
                                    {item.indicator}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ),
        {
            ...size,
        },
    );
}
