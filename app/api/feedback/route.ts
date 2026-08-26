import {
  deleteStorageObject,
  privateStorageUrl,
  supabaseRequest,
  uploadStorageObject,
} from "@/lib/supabase-server";

const PHOTO_BUCKET = "feedback-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const CATEGORIES = new Set([
  "सड़क", "पानी", "सफाई", "स्ट्रीट लाइट", "नाली",
  "सीवरेज", "स्वास्थ्य", "शिक्षा", "अतिक्रमण", "अन्य",
]);
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function text(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

async function detectedImageType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export async function POST(request: Request) {
  let uploadedPath: string | null = null;
  try {
    const form = await request.formData();
    if (text(form, "website", 100)) return Response.json({ ok: true }, { status: 201 });

    const name = text(form, "name", 80);
    const mobile = text(form, "mobile", 15);
    const wardNumber = Number(text(form, "ward", 12).replace(/\D/g, ""));
    const area = text(form, "area", 100);
    const category = text(form, "category", 40);
    const message = text(form, "message", 800);

    if (
      !name || !/^\+?[0-9 ]{10,15}$/.test(mobile) ||
      !Number.isInteger(wardNumber) || wardNumber < 1 || wardNumber > 45 ||
      !area || !CATEGORIES.has(category) || message.length < 5
    ) {
      return Response.json({ error: "कृपया सभी जरूरी जानकारी सही भरें।" }, { status: 400 });
    }

    const photoEntry = form.get("photo");
    const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;
    let photoUrl: string | null = null;

    if (photo) {
      if (photo.size > MAX_PHOTO_BYTES) {
        return Response.json({ error: "फोटो का आकार 5 MB से अधिक नहीं होना चाहिए।" }, { status: 400 });
      }
      const actualMime = await detectedImageType(photo);
      const declaredMime = photo.type === "image/jpg" ? "image/jpeg" : photo.type;
      if (!actualMime || !MIME_EXTENSIONS[photo.type] || actualMime !== declaredMime) {
        return Response.json({ error: "केवल JPG, JPEG, PNG या WebP फोटो चुनें।" }, { status: 400 });
      }
      const now = new Date();
      uploadedPath = `feedback/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${MIME_EXTENSIONS[actualMime]}`;
      const uploadFile = photo.type === actualMime
        ? photo
        : new File([photo], photo.name, { type: actualMime, lastModified: photo.lastModified });
      const upload = await uploadStorageObject(PHOTO_BUCKET, uploadedPath, uploadFile);
      if (!upload.ok) throw new Error(`Photo upload failed: ${await upload.text()}`);
      photoUrl = privateStorageUrl(PHOTO_BUCKET, uploadedPath);
    }

    const record: Record<string, string | boolean | null> = {
      name,
      mobile,
      ward: `वार्ड ${wardNumber}`,
      area,
      category,
      message,
      consent: form.get("consent") === "true",
    };
    if (uploadedPath) {
      record.photo_url = photoUrl;
      record.photo_path = uploadedPath;
    }

    const response = await supabaseRequest("feedback?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(await response.text());
    const [row] = await response.json() as Array<{ id: number }>;
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) {
    if (uploadedPath) await deleteStorageObject(PHOTO_BUCKET, uploadedPath).catch(() => undefined);
    console.error("Feedback submission failed", error);
    return Response.json({ error: "अभी फीडबैक दर्ज नहीं हो पाया। कृपया दोबारा प्रयास करें।" }, { status: 500 });
  }
}
