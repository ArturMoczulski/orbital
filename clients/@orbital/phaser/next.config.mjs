/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the gateway to avoid CORS issues
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.KILOAXE_GATEWAY_BASE_URL}/api/:path*`,
      },
    ];
  },
  transpilePackages: ["inversify", "reflect-metadata"],
  webpack: (config, { isServer }) => {
    // Fix for inversify when using with Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
