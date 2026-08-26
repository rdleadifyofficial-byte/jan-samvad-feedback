import "server-only";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return { url, key };
}

function storagePath(bucket: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${encodeURIComponent(bucket)}/${encodedPath}`;
}

function authHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.authorization = `Bearer ${key}`;
  return headers;
}

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...authHeaders(key),
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

export function privateStorageUrl(bucket: string, path: string) {
  const { url } = config();
  return `${url}/storage/v1/object/authenticated/${storagePath(bucket, path)}`;
}

export async function uploadStorageObject(bucket: string, path: string, file: File) {
  const { url, key } = config();
  return fetch(`${url}/storage/v1/object/${storagePath(bucket, path)}`, {
    method: "POST",
    headers: {
      ...authHeaders(key),
      "content-type": file.type,
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
    cache: "no-store",
  });
}

export async function deleteStorageObject(bucket: string, path: string) {
  const { url, key } = config();
  return fetch(`${url}/storage/v1/object/${storagePath(bucket, path)}`, {
    method: "DELETE",
    headers: authHeaders(key),
    cache: "no-store",
  });
}

export async function createSignedStorageUrl(bucket: string, path: string, expiresIn = 3600) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/sign/${storagePath(bucket, path)}`, {
    method: "POST",
    headers: { ...authHeaders(key), "content-type": "application/json" },
    body: JSON.stringify({ expiresIn }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const result = await response.json() as { signedURL?: string; signedUrl?: string };
  const signedUrl = result.signedURL ?? result.signedUrl;
  if (!signedUrl) return null;
  if (/^https?:\/\//.test(signedUrl)) return signedUrl;
  if (signedUrl.startsWith("/storage/v1/")) return `${url}${signedUrl}`;
  return `${url}/storage/v1${signedUrl.startsWith("/") ? "" : "/"}${signedUrl}`;
}
