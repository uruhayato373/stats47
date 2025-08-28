import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    // Co-location: コンポーネントと同じディレクトリのストーリー
    "../src/**/*.story.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    // Storybook 9.0では以下のアドオンは統合されています
    // - @storybook/addon-controls → 標準で利用可能
    // - @storybook/addon-actions → 標準で利用可能
    // - @storybook/addon-viewport → 標準で利用可能
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {
      // Next.js App Routerのサポート
    },
  },
  staticDirs: ["../public"],
  typescript: {
    check: false,
  },
  viteFinal: async (config) => {
    // Tailwind CSSのサポート
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": "/src",
      };
    }
    return config;
  },
  // Next.jsとの互換性向上
  core: {
    builder: "@storybook/builder-vite",
  },
  // Storybook 9.0の新機能
  docs: {
    // autodocsはStorybook 9.0では標準で有効
  },
};
export default config;
