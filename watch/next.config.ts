import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-hosting note: standard `next build` + `next start` deployment
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
