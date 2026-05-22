"use client";

import dynamic from "next/dynamic";

const LandingDeferredContent = dynamic(
  () => import("./landing-deferred-content").then((mod) => mod.LandingDeferredContent),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-[#cbbfb1] sm:px-6 lg:px-8">
        Carregando recursos da plataforma...
      </div>
    ),
  },
);

export function LandingDeferredLoader() {
  return <LandingDeferredContent />;
}
