const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@orbital/phaser-ui", "@orbital/react-ui"],
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
          : "../../../libs/@orbital/react-ui/dist"
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
};
