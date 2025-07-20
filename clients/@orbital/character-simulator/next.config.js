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

  // Explicitly define which extensions are valid for pages
  // This is the key configuration to exclude Cypress files
  pageExtensions: ["tsx", "ts", "jsx", "js"].filter(
    (ext) => !ext.includes("cy")
  ),

  webpack(config, { dev, ...options }) {
    // More aggressive approach to exclude Cypress files

    // Add a rule to exclude all Cypress test files
    config.module.rules.push({
      test: /\.(e2e\.cy|cy)\.(ts|tsx|js|jsx)$/,
      use: "null-loader",
    });

    // Add a more specific rule for the exact file causing issues
    config.module.rules.push({
      test: /pages[\\/]index\.e2e\.cy\.tsx$/,
      use: "null-loader",
      include: [path.resolve(__dirname, "pages")],
    });

    // Use a more specific IgnorePlugin configuration
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /index\.e2e\.cy\.tsx$/,
        contextRegExp: /pages/,
      })
    );

    // Continue with the existing webpack config
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
