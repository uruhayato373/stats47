import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/providers/JotaiProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CMS Dashboard",
  description:
    "A modern CMS dashboard for managing posts, members, and site content with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="relative min-h-full">
      <body
        className={`${inter.variable} font-sans bg-gray-100 dark:bg-neutral-900 antialiased`}
      >
        <ThemeProvider>
          <JotaiProvider>{children}</JotaiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
