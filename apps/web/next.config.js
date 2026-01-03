/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@linkedin-crm/types'],
  images: {
    domains: ['media.licdn.com', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig;
