/** @type {import('next').NextConfig} */
function resolveApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "http://127.0.0.1:8000";

  let origin = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(origin)) {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
    origin = `${isLocal ? "http" : "https"}://${origin}`;
  }

  try {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL "${raw}". Use a full URL (https://api.example.com) or hostname (api.example.com).`
    );
  }
}

const API_ORIGIN = resolveApiOrigin();

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
