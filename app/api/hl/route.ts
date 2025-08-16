export const runtime = "edge";

const HL_MAINNET = "https://api.hyperliquid.xyz/info";

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(HL_MAINNET, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store"
    }
  });
}
