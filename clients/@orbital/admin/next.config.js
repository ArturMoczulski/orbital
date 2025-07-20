const path = require("path");
const withTM = require("next-transpile-modules")([
  "@orbital/phaser-ui",
  "@orbital/react-ui",
  "@orbital/phaser",
  "@orbital/core",
  "@orbital/characters",
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
  pageExtensions: ["tsx", "ts", "jsx", "js"].filter(
    (ext) => !ext.includes("cy.")
  ),
  webpack(config, { dev }) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@orbital/phaser-ui": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/phaser-ui/src"
          : "../../../libs/@orbital/phaser-ui/dist"
      ),
      "@orbital/react-ui": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/react-ui/src"
          : "../../../libs/@orbital/react-ui/dist/react-ui/src"
      ),
      "@orbital/characters": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/characters/src"
          : "../../../libs/@orbital/characters/dist"
      ),
      "@orbital/core": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/core/src"
          : "../../../libs/@orbital/core/dist"
      ),
      "@orbital/core/src": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/core/src"
          : "../../../libs/@orbital/core/dist"
      ),
      "@orbital/core/src/zod/reference/reference": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/core/src/zod/reference/reference"
          : "../../../libs/@orbital/core/dist/zod/reference/reference"
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
    return [
      {
        source: "/api/admin/:path*",
        destination: process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL + "/:path*",
      },
      {
        source: "/api/world/:path*",
        destination: process.env.NEXT_PUBLIC_WORLD_URL + "/:path*",
      },
    ];
  },
});

module.exports = nextConfig;
