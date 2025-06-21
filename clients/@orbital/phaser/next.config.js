const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@orbital/phaser-ui"],
  webpack(config, { dev }) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@orbital/phaser-ui": path.resolve(
        __dirname,
        dev
          ? "../../../libs/@orbital/phaser-ui/src"
          : "../../../libs/@orbital/phaser-ui/dist"
      ),
    };
    return config;
  },
};
