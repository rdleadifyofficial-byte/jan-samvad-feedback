import "server-only";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return { url, key };
}

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const authorization = key.startsWith("sb_secret_")
    ? {}
    : { authorization: `Bearer ${key}` };

  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      ...authorization,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}
