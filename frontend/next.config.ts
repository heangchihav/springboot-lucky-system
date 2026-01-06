import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ["en", "km"],
    defaultLocale: "en",
  },
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
