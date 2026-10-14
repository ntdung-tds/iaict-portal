const isGithubPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = isGithubPages
  ? {
      output: "export",
      trailingSlash: true,
      basePath: "/iaict-portal",
      images: {
        unoptimized: true,
      },
    }
  : {};

export default nextConfig;
