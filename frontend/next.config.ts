import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép mở bản dev qua 127.0.0.1 (vd. thử 1v1 với hai người chơi trên cùng một máy)
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
