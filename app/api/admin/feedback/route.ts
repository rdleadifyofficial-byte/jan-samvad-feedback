import { createSignedStorageUrl, supabaseRequest } from "@/lib/supabase-server";

const PHOTO_BUCKET = "feedback-photos";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json() as { pin?: string };
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return Response.json({ error: "Admin PIN गलत है।" }, { status: 401 });
    }
    const response = await supabaseRequest("feedback?select=*&order=created_at.desc&limit=500");
    if (!response.ok) throw new Error(await response.text());
    const raw = await response.json() as Array<Record<string, unknown>>;
    const rows = await Promise.all(raw.map(async (item) => {
      const photoPath = typeof item.photo_path === "string" ? item.photo_path : null;
      const photoUrl = photoPath
        ? await createSignedStorageUrl(PHOTO_BUCKET, photoPath, 60 * 60)
        : null;
      return { ...item, createdAt: item.created_at, photoPath, photoUrl };
    }));
    return Response.json({ feedback: rows });
  } catch (error) {
    console.error("Admin inbox load failed", error);
    return Response.json({ error: "Inbox अभी load नहीं हो पाया।" }, { status: 500 });
  }
}
