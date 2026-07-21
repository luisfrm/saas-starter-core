import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: [
    "../src/components/ui/**/*.stories.@(ts|tsx)",
    "../src/components/*.stories.@(ts|tsx)",
    "../src/stories/**/*.mdx",
  ],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
}

export default config
