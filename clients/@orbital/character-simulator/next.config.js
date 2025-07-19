const path = require("path");
const withTM = require("next-transpile-modules")([
  "@orbital/react-ui",
  "@mui/material",
  "@mui/system",
  "@mui/styled-engine",
  "@mui/icons-material",
  "@mui/lab",
  "@mui/x-tree-view",
]);

/** @type {import('next').NextConfig} */
const nextConfig = withTM({
  reactStrictMode: true,
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  webpack(config, { dev }) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@orbital/react-ui": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/react-ui/src"
          : "../../../libs/@orbital/react-ui/dist/src"
      ),
      // force every import to hit the *one* hoisted copy
      "@emotion/react": path.resolve(
        __dirname,
        "../../../node_modules/@emotion/react"
      ),
      "@emotion/styled": path.resolve(
        __dirname,
        "../../../node_modules/@emotion/styled"
      ),
    };
    return config;
  },
  async rewrites() {
    // Only add the rewrite if NEXT_PUBLIC_WORLD_URL is defined
    if (process.env.NEXT_PUBLIC_WORLD_URL) {
      return [
        {
          source: "/api/world/:path*",
          destination: process.env.NEXT_PUBLIC_WORLD_URL + "/:path*",
        },
      ];
    }
    return [];
  },
});

module.exports = nextConfig;
