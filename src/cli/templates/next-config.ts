export function nextConfigTs(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  webpack(config) {
    config.module.rules.unshift({
      test: /\\.glsl$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
`;
}
