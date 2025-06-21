/** @type {import('next').NextConfig} */
const path = require("path");

module.exports = {
  reactStrictMode: true,
  // Transpile shared Phaser UI TS source
  transpilePackages: ["@kiloaxe/phaser-ui"],
  webpack(config, { dev }) {
    // Alias Phaser UI to source in development, dist in production
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@kiloaxe/phaser-ui": path.resolve(
        __dirname,
        dev ? "../shared/phaser-ui/src" : "../shared/phaser-ui/dist"
      ),
    };
    return config;
  },
};
