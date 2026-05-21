import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context?.isAdmin) return NextResponse.json({ error: "Admin obrigatorio." }, { status: 403 });

  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [
    users,
    documents,
    videos,
    aiLogs,
    uploadErrors,
    criticalLogs,
    leads,
    expiringLicenses,
    storageDocs,
    storageVideos,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("documents").select("id", { count: "exact", head: true }),
    admin.from("videos").select("id", { count: "exact", head: true }),
    admin.from("system_logs").select("id,metadata,created_at", { count: "exact" }).eq("source", "ai").gte("created_at", since).limit(100),
    admin.from("system_logs").select("id", { count: "exact", head: true }).in("event", ["document.process_failed", "video.process_failed"]).gte("created_at", since),
    admin.from("system_logs").select("id,event,level,created_at,metadata").in("level", ["error", "critical"]).order("created_at", { ascending: false }).limit(20),
    admin.from("lead_captures").select("id", { count: "exact", head: true }),
    admin
      .from("licenses")
      .select("id,user_id,status,expires_at", { count: "exact" })
      .in("status", ["active", "trial"])
      .lte("expires_at", new Date(Date.now() + 7 * 86400000).toISOString())
      .gte("expires_at", new Date().toISOString())
      .limit(20),
    admin.from("documents").select("file_size").not("file_size", "is", null),
    admin.from("videos").select("file_size").not("file_size", "is", null),
  ]);

  const aiCostEstimate = (aiLogs.data ?? []).reduce((total, log) => {
    const tokenEstimate = Number((log.metadata as Record<string, unknown> | null)?.token_estimate ?? 0);
    return total + tokenEstimate;
  }, 0);
  const storageBytes = [...(storageDocs.data ?? []), ...(storageVideos.data ?? [])].reduce((total, row) => total + Number(row.file_size ?? 0), 0);

  return NextResponse.json({
    users: users.count ?? 0,
    documents: documents.count ?? 0,
    videos: videos.count ?? 0,
    aiCalls7d: aiLogs.count ?? 0,
    aiTokenEstimate7d: aiCostEstimate,
    uploadErrors7d: uploadErrors.count ?? 0,
    leads: leads.count ?? 0,
    expiringLicenses: expiringLicenses.data ?? [],
    storageBytes,
    recentErrors: criticalLogs.data ?? [],
  });
}
