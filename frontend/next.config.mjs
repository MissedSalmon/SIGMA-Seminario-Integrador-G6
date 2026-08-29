/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Agregamos las extensiones permitidas para no tener que escribirlas en los imports
    if (!config.resolve) config.resolve = {};
    config.resolve.extensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss',
      ...(config.resolve.extensions || [])
    ];
    return config;
  },
};

export default nextConfig;
