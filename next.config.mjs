/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const terser = config.optimization.minimizer.find(
        (plugin) => plugin.constructor.name === "TerserPlugin"
      );
      
      if (terser) {
        terser.options.terserOptions = {
          ...terser.options.terserOptions,
          mangle: true,
          compress: {
            ...terser.options.terserOptions?.compress,
            drop_console: true,
            passes: 2,
          },
          keep_classnames: false,
          keep_fnames: false,
        };
      }
    }
    return config;
  },
};

export default nextConfig;