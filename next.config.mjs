/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ⚡ Add this line right here to fix your Sequelize/Turbopack error!
  serverExternalPackages: ["sequelize", "mysql2"],
};

export default nextConfig;
