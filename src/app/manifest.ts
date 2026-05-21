import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TEPM Study",
    short_name: "TEPM Study",
    description: "Plataforma privada de estudos terapeuticos com IA, memoria inteligente e trilhas de revisao.",
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
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
