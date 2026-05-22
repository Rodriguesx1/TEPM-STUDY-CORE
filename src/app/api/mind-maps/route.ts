import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Meu mapa mental";
    const markdown = `# ${title}\n\n## Tema central\n\n### Primeiro ramo\n\n* Ideia principal\n* Proximo passo`;
    const legacyPayload = {
      user_id: auth.user.id,
      title,
      nodes: ["Primeiro ramo"],
      edges: [],
      markdown,
    };

    const modernPayload = {
      ...legacyPayload,
      map_json: {
        title,
        central_theme: title,
        branches: [{ title: "Primeiro ramo", subtopics: ["Ideia principal", "Proximo passo"], key_points: [] }],
        practical_applications: [],
        study_questions: [],
        markdown,
      },
    };

    let created = await admin.from("mind_maps").insert(modernPayload).select("*").single();
    if (created.error && /map_json/i.test(created.error.message)) {
      created = await admin.from("mind_maps").insert(legacyPayload).select("*").single();
    }
    if (created.error) throw created.error;

    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: "mind_map.manual_create", entity_type: "mind_maps", entity_id: created.data.id });
    return NextResponse.json({ mindMap: created.data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar mapa mental." }, { status: 500 });
  }
}
