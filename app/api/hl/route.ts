// app/api/hl/route.ts
export const runtime = "edge"; // fast + cheap

const HL_MAINNET = "https://api.hyperliquid.xyz/info";

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(HL_MAINNET, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    // You can add a short timeout pattern if you like (AbortController)
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
