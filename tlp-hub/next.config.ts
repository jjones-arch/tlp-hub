import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGhPages
    ? {
        output: "export",
        basePath: "/tlp-hub",
        images: { unoptimized: true },
      }
    : {
        experimental: {
          serverActions: {
            bodySizeLimit: "10mb",
          },
        },
      }),
};

export default nextConfig;
