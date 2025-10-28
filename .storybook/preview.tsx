import React, { useEffect, useState } from "react";

import type { Preview } from "@storybook/nextjs-vite";
import "./storybook.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    // ダークモードのサポート
    darkMode: {
      current: "light",
    },
  },

  // グローバルデコレーターを追加
  decorators: [
    (Story, context) => {
      const [theme, setTheme] = useState<"light" | "dark">("light");

      // Storybookのダークモード設定を監視
      useEffect(() => {
        const isDark =
          context.globals?.darkMode === "dark" ||
          document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
      }, [context.globals]);

      // テーマクラスを適用
      useEffect(() => {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        // Storybook用に背景色をリセット
        document.body.style.backgroundColor = "transparent";
      }, [theme]);

      return (
        <div
          className={`min-h-screen ${
            theme === "dark" ? "dark bg-neutral-900" : "bg-white"
          }`}
        >
          <div className="p-4">
            <Story />
          </div>
        </div>
      );
    },
  ],

  globalTypes: {
    darkMode: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "circlehollow", title: "Light" },
          { value: "dark", icon: "circle", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
