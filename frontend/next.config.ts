/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // WARNING: this allows builds to complete even with TS errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;