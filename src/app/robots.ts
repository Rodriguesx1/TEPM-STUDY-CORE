import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://tepmstudy.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/.env",
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/backup",
          "/backups",
          "/biblioteca",
          "/bloqueado",
          "/caderno",
          "/chat",
          "/comunidade",
          "/dashboard",
          "/debug",
          "/docs",
          "/login",
          "/supabase",
          "/trilhas",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
