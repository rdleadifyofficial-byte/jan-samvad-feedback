import { supabaseRequest } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return Response.json({ ok: true }, { status: 201 });
    const value = (key: string, max: number) => String(body[key] ?? "").trim().slice(0, max);
    const name=value("name",80), mobile=value("mobile",15), ward=value("ward",12), area=value("area",100), category=value("category",40), message=value("message",800);
    const wardNumber = Number(ward.replace(/\D/g, ""));
    if (!name || !/^\+?[0-9 ]{10,15}$/.test(mobile) || wardNumber < 1 || wardNumber > 45 || !area || !category || message.length < 5) return Response.json({ error: "कृपया सभी जानकारी सही भरें।" }, { status: 400 });
    const response = await supabaseRequest("feedback?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ name, mobile, ward: `वार्ड ${wardNumber}`, area, category, message, consent: body.consent === true }),
    });
    if (!response.ok) throw new Error(await response.text());
    const [row] = await response.json() as Array<{id:number}>;
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch { return Response.json({ error: "अभी फीडबैक दर्ज नहीं हो पाया।" }, { status: 500 }); }
}
