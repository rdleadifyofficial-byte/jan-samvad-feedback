import { supabaseRequest } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json() as { pin?: string };
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return Response.json({ error: "Admin PIN गलत है।" }, { status: 401 });
    const response = await supabaseRequest("feedback?select=*&order=created_at.desc&limit=500");
    if (!response.ok) throw new Error(await response.text());
    const raw = await response.json() as Array<Record<string, unknown>>;
    const rows = raw.map(x => ({ ...x, createdAt: x.created_at }));
    return Response.json({ feedback: rows });
  } catch { return Response.json({ error: "Inbox अभी load नहीं हो पाया।" }, { status: 500 }); }
}
