import { redirect } from "next/navigation";
import { MindMapsWorkspace } from "@/components/mind-maps/mind-maps-workspace";
import { requireUser } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";
import type { MindMapRecord } from "@/types/mind-map";

export default async function MindMapsPage({ searchParams }: { searchParams: Promise<{ map?: string }> }) {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const { map } = await searchParams;

  const { data, error } = await supabase
    .from("mind_maps")
    .select("id,user_id,document_id,title,map_json,markdown,created_at,documents(title,theme)")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });

  if (error) redirect("/dashboard/library");
  const maps = ((data ?? []) as Array<Omit<MindMapRecord, "documents"> & { documents?: MindMapRecord["documents"] | MindMapRecord["documents"][] }>).map(
    (item) => ({
      ...item,
      documents: Array.isArray(item.documents) ? item.documents[0] ?? null : item.documents ?? null,
    }),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border bg-white/85 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mind Elixir</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-[#183c35]">Mapas mentais</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          Area separada para visualizar, navegar, editar localmente, centralizar e exportar os mapas mentais gerados a partir dos PDFs processados.
        </p>
      </section>

      <MindMapsWorkspace maps={maps} selectedId={map} />
    </div>
  );
}
