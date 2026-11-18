export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";
  const ua = request.headers.get("User-Agent") || "";
  const host = new URL(request.url).origin;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  if (
    origin !== host ||
    !referer.startsWith(host) ||
    !ua ||
    /curl|wget|python|scrapy|httpclient|bot|spider|headless/i.test(ua)
  ) {
    return new Response("UNDER ATTACK", { status: 403, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("UNDER ATTACK", { status: 403, headers });
  }

  const ts = Number(body?.t);
  if (!ts || Math.abs(Date.now() - ts) > 15000) {
    return new Response("UNDER ATTACK", { status: 403, headers });
  }

  const mask = (ts % 251) || 73;
  const scrambled = btoa(
    Array.from(env.TORRENT_ID)
      .map((ch) => String.fromCharCode(ch.charCodeAt(0) ^ mask))
      .join("")
  );

  return new Response(JSON.stringify({ p: scrambled, m: mask }), { headers });
}
