import type { NextConfig } from "next";

// Static export mode is enabled when BUILD_STATIC=true at build time.
// This lets us produce a GitHub Pages-compatible static site without
// breaking the existing `next build` (standalone) workflow.
const IS_STATIC_BUILD = process.env.BUILD_STATIC === "true";

const nextConfig: NextConfig = {
  output: IS_STATIC_BUILD ? "export" : "standalone",
  // basePath is set from NEXT_PUBLIC_BASE_PATH so client fetches can read the same value.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // Required for static export — no Next.js Image Optimization server.
  images: { unoptimized: IS_STATIC_BUILD },
  // Trailing slashes play nicer with GitHub Pages static file hosting.
  trailingSlash: IS_STATIC_BUILD,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
