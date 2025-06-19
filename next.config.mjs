const JavaScriptObfuscator = (await import('webpack-obfuscator')).default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      config.plugins.push(
        new JavaScriptObfuscator(
          {
            rotateStringArray: true,
            compact: true,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 0.75,
          },
          ['excluded.js']
        )
      );
    }

    return config;
  },
};

export default nextConfig;