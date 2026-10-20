import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions have a default request body size limit of 1 MB.
  // We raise it to 3 MB under `experimental.serverActions.bodySizeLimit` to accommodate
  // 2 MB image uploads plus multipart encoding overhead, while staying well below
  // the ~4.5 MB Vercel Serverless Function payload limit.
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
