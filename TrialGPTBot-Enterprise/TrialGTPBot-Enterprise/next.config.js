/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['z-ai-web-dev-sdk'],
  },
  async rewrites() {
    return [
      {
        source: '/api/fda/:path*',
        destination: 'https://api.fda.gov/:path*',
      },
      {
        source: '/api/clinicaltrials/:path*',
        destination: 'https://clinicaltrials.gov/api/v2/:path*',
      },
      {
        source: '/api/fhir/:path*',
        destination: 'https://hapi.fhir.org/baseR4/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
