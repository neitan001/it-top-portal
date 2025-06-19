module.exports = {
  reactStrictMode: true,
  compress: {
    drop_console: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const terser = config.optimization.minimizer.find(
        (plugin) => plugin.constructor.name === "TerserPlugin"
      );
      if (terser) {
        terser.options.terserOptions = {
          mangle: true,
          keep_classnames: false,
          keep_fnames: false,
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
            pure_funcs: ['console.info'],
            passes: 2,
          },
        };
      }
    }
    return config;
  },
};