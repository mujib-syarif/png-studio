export async function onRequest({ request, env }) {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { "Allow": "POST, OPTIONS", "Cache-Control": "no-store" }
    });
  }

  if (!env.API) {
    return new Response(JSON.stringify({
      error: "Backend belum terhubung. Tambahkan Service binding bernama API yang menunjuk ke Worker png-studio-api, lalu redeploy Pages."
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  const upstreamUrl = new URL(request.url);
  upstreamUrl.hostname = "png-studio-api.internal";
  upstreamUrl.protocol = "https:";
  return env.API.fetch(new Request(upstreamUrl.toString(), request));
}
