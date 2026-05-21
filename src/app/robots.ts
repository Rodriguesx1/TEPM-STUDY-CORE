import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tepmstudy.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api", "/biblioteca", "/chat", "/caderno", "/comunidade", "/trilhas"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
