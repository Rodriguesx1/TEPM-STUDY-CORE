import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TEPM Study",
    short_name: "TEPM Study",
    description: "Plataforma privada de estudos terapêuticos com IA, memória inteligente e trilhas de revisão.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    background_color: "#f3fbf6",
    theme_color: "#2f7d68",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
