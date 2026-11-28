import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 72, 85],
  },
  // The app used to live under /app. Old bookmarks and email links still work.
  async redirects() {
    return [
      { source: "/app", destination: "/galleries", permanent: true },
      { source: "/app/galleries/:path*", destination: "/galleries/:path*", permanent: true },
      { source: "/app/upload", destination: "/uploads", permanent: true },
      { source: "/app/settings/studio", destination: "/studio", permanent: true },
      { source: "/app/settings/profile", destination: "/profile", permanent: true },
      { source: "/app/onboarding", destination: "/onboarding", permanent: true },
      { source: "/app/:path*", destination: "/galleries", permanent: true },
    ]
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
