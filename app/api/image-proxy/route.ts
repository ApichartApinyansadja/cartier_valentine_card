import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    // Basic allowlist: only proxy images from cartier.com
    const u = new URL(url);
    const allowedHosts = ["www.cartier.com", "cartier.com"];
    if (!allowedHosts.includes(u.hostname)) {
      return new Response("Host not allowed", { status: 403 });
    }

    const resp = await fetch(url);
    if (!resp.ok) {
      return new Response("Upstream fetch failed", { status: 502 });
    }

    const contentType = resp.headers.get("content-type") || "image/png";
    const buffer = await resp.arrayBuffer();

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        // Same-origin already; CORS not strictly needed, but harmless
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("Image proxy error", e);
    return new Response("Proxy error", { status: 500 });
  }
}
