import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // The tour used to live here. Browsers carry the fragment across a 307,
      // so /3d#cells still lands on the speciesOT stop.
      { source: "/3d", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
