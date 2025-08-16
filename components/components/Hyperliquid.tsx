// components/Hyperliquid.tsx
"use client";
import React, { useMemo, useState } from "react";

/**
 * Hyperliquid Social Signals — React Frontend (Landing + App, Mock Data)
 * - Home (landing) with CTAs
 * - Leaderboard, Trader Profile slide-over, Alerts, About
 * - Premium but simple dark UI, mock data + SVG charts
 */

type Timeframe = "24h" | "7d" | "30d";
type SortKey = "pnlPct" | "pnlUsd" | "winRate" | "sharpe" | "trades" | "volume24h";
type Market = "ALL" | "ETH" | "BTC" | "ALTS";

type Position = { symbol: string; side: "LONG" | "SHORT"; sizeUsd: number; entry: number; liq?: number; unrealizedPnlUsd: number; };
type Trade = { ts: number; symbol: string; side: "BUY" | "SELL"; sizeUsd: number; price: number; pnlUsd?: number };
type Signal = { id: string; ts: number; event: "OPEN" | "CLOSE" | "FLIP"; symbol: string; side: "LONG" | "SHORT"; sizeUsd: number; price: number };
type Trader = {
  address: string; handle?: string; marketFocus: Market;
  stats: {
    pnlPct: Record<Timeframe, number>;
    pnlUsd: Record<Timeframe, number>;
    winRate: number; sharpe: number; trades: number; volume24h: number; maxDdPct: number; avgTradeUsd: number;
  };
  spark: Record<Timeframe, number[]>; positions: Position[]; history: Trade[]; signals: Signal[];
};

function clsx(...parts: Array<string | false | undefined>) { return parts.filter(Boolean).join(" "); }
function fmtPct(x: number, dp = 2) { const sign = x > 0 ? "+" : x < 0 ? "" : ""; return `${sign}${x.toFixed(dp)}%`; }
function fmtUsd(x: number) { const abs = Math.abs(x); const sign = x < 0 ? "-" : ""; if (abs>=1_000_000_000) return `${sign}$${(abs/1_000_000_000).toFixed(2)}B`; if (abs>=1_000_000) return `${sign}$${(abs/1_000_000).toFixed(2)}M`; if (abs>=10_000) return `${sign}$${(abs/1_000).toFixed(1)}k`; return `${sign}$${abs.toFixed(2)}`; }
function shortAddr(a: string){ return a.slice(0,6)+"…"+a.slice(-4); }
function seedRand(seed:number){ let s = seed>>>0; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%1_000_000)/1_000_000; }; }
function genSeries(n:number, rand:()=>number){ const arr=Array.from({length:n},()=>rand()); for(let i=1;i<n;i++) arr[i]=(arr[i-1]*0.7+arr[i]*0.3); const mn=Math.min(...arr); const mx=Math.max(...arr); return arr.map(v=>mx-mn?(v-mn)/(mx-mn):0.5); }
function sparkPath(values:number[], w=120, h=36, pad=2){ if(!values.length) return ""; const n=values.length; const step=(w-pad*2)/(n-1); const y=(v:number)=>h-pad-v*(h-pad*2); let d=`M ${pad} ${y(values[0])}`; for(let i=1;i<n;i++) d+=` L ${pad+i*step} ${y(values[i])}`; return d; }
function hashColor(input:string){ let h=0; for(let i=0;i<input.length;i++) h=(h*31+input.charCodeAt(i))|0; const hue=Math.abs(h)%360; return `hsl(${hue} 70% 45%)`; }

// --- Mock data creators
function makeTrader(idx:number, rand:()=>number): Trader {
  const addr = `0x${(idx+1).toString(16).padStart(2,"0")}a${(idx*99991).toString(16).padStart(36,"0")}`.slice(0,42);
  const pnlPct = { "24h": (rand()-0.45)*200*(0.4+rand()), "7d": (rand()-0.45)*200*(0.9+rand()), "30d": (rand()-0.45)*200*(1.3+rand()) } as Record<Timeframe, number>;
  const pnlUsd = { "24h": (rand()-0.4)*50_000, "7d": (rand()-0.4)*200_000, "30d": (rand()-0.4)*600_000 } as Record<Timeframe, number>;
  const spark = { "24h": genSeries(24, rand), "7d": genSeries(56, rand), "30d": genSeries(120, rand) } as Record<Timeframe, number[]>;
  const marketFocus: Market = (["ETH","BTC","ALTS"] as Market[])[Math.floor(rand()*3)];
  const positions: Position[] = Array.from({ length: Math.floor(rand()*3) }, () => {
    const syms = ["ETH","BTC","SOL","DOGE","ARB","OP"]; const symbol = syms[Math.floor(rand()*syms.length)];
    const side = rand()>0.5 ? "LONG" : "SHORT"; const sizeUsd = Math.floor(10_000 + rand()*150_000);
    const entry = +(100 + rand()*4000).toFixed(2); const liq = +(entry*(0.4+rand()*0.4)).toFixed(2);
    const unrealizedPnlUsd = Math.floor((rand()-0.4)*10_000);
    return { symbol, side, sizeUsd, entry, liq, unrealizedPnlUsd };
  });
  const history: Trade[] = Array.from({ length: 12 }, () => ({ ts: Date.now() - Math.floor(rand()*1000*60*60*72), symbol: ["ETH","BTC","SOL"][Math.floor(rand()*3)], side: rand()>0.5?"BUY":"SELL", sizeUsd: Math.floor(1_000+rand()*80_000), price: +(100+rand()*4000).toFixed(2), pnlUsd: Math.floor((rand()-0.4)*8000) }));
  const signals: Signal[] = history.slice(0,6).map((t,i)=>({ id:`${addr}-${i}`, ts:t.ts, event:(i%3===0?"FLIP":i%2===0?"CLOSE":"OPEN"), symbol:t.symbol, side:t.side==="BUY"?"LONG":"SHORT", sizeUsd:t.sizeUsd, price:t.price }));
  return {
    address: addr,
    handle: rand()>0.6 ? `alpha_${idx+1}` : undefined,
    marketFocus,
    stats: { pnlPct, pnlUsd, winRate: 0.4+rand()*0.5, sharpe:+(0.2+rand()*2).toFixed(2), trades: Math.floor(50+rand()*1200), volume24h: Math.floor(50_000+rand()*3_500_000), maxDdPct: +(rand()*45).toFixed(2), avgTradeUsd: Math.floor(500+rand()*15000) },
    spark, positions, history, signals
  };
}
function makeDataset(count=42, seed=1337){ const r=seedRand(seed); return Array.from({length:count},(_,i)=>makeTrader(i,r)); }

const Pill = ({ children }:{children:React.ReactNode}) => (<span className="px-2 py-1 rounded-full bg-white/5 text-white/80 text-xs border border-white/10">{children}</span>);
const StatCard = ({ label, value, sub }:{label:string; value:string; sub?:string}) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm">
    <div className="text-xs text-white/60">{label}</div>
    <div className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</div>
    {sub ? <div className="mt-0.5 text-[11px] text-white/50">{sub}</div> : null}
  </div>
);
function Sparkline({ values }:{values:number[]}) { return (<svg viewBox="0 0 120 36" className="w-[120px] h-9 overflow-visible"><path d={sparkPath(values)} fill="none" stroke="currentColor" className="text-white/60" strokeWidth={1.5}/></svg>); }
function TabButton({ label, active, onClick }:{label:string; active?:boolean; onClick:()=>void}) {
  return <button onClick={onClick} className={clsx("px-3 py-1.5 rounded-lg text-sm border", active?"bg-white/10 border-white/20":"bg-transparent border-transparent hover:bg-white/5")}>{label}</button>;
}
function Th({ children, right }:{children:React.ReactNode; right?:boolean}) { return <th className={clsx("px-3 py-2 font-normal text-left", right&&"text-right")}>{children}</th>; }
function Td({ children, right, center, colSpan }:{children:React.ReactNode; right?:boolean; center?:boolean; colSpan?:number}) { return <td colSpan={colSpan} className={clsx("px-3 py-2", right&&"text-right", center&&"text-center")}>{children}</td>; }

// Small inputs
function SelectGroup<T extends string>({ label, value, onChange, options }:{ label:string; value:T; onChange:(v:T)=>void; options:T[] }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-white/60 mb-1">{label}</label>
      <select value={value} onChange={(e)=>onChange(e.target.value as T)} className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50">
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const FeatureCard = ({ title, desc }:{title:string; desc:string}) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
    <div className="text-sm font-medium">{title}</div>
    <div className="text-white/60 text-sm mt-1">{desc}</div>
  </div>
);

export default function HyperliquidSocialSignalsSite() {
  const [activeTab, setActiveTab] = useState<"home" | "leaderboard" | "alerts" | "about">("home");
  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [sortKey, setSortKey] = useState<SortKey>("pnlPct");
  const [market, setMarket] = useState<Market>("ALL");
  const [search, setSearch] = useState("");
  const [dataset] = useState<Trader[]>(() => makeDataset(42));
  const [selected, setSelected] = useState<Trader | null>(null);
  const [follows, setFollows] = useState<Record<string, boolean>>({});
  const [telegramBound, setTelegramBound] = useState(false);
  const [minSize, setMinSize] = useState(5000);
  const [symbols, setSymbols] = useState<string[]>(["ETH","BTC"]);
  const [events, setEvents] = useState<string[]>(["OPEN","CLOSE","FLIP"]);

  // 🔗 Links (env-driven on client)
  const TELEGRAM_BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/YOUR_BOT_NAME?start=app";
  const HYPERLIQUID_REF_URL = process.env.NEXT_PUBLIC_HYPERLIQUID_REF_URL || "https://app.hyperliquid.xyz/?ref=YOUR_REF_CODE";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataset
      .filter(t => (market==="ALL" ? true : t.marketFocus===market))
      .filter(t => q ? ((t.handle && t.handle.toLowerCase().includes(q)) || t.address.toLowerCase().includes(q) || shortAddr(t.address).toLowerCase().includes(q)) : true)
      .sort((a,b) => {
        switch (sortKey) {
          case "pnlPct": return b.stats.pnlPct[timeframe]-a.stats.pnlPct[timeframe];
          case "pnlUsd": return b.stats.pnlUsd[timeframe]-a.stats.pnlUsd[timeframe];
          case "winRate": return b.stats.winRate-a.stats.winRate;
          case "sharpe": return b.stats.sharpe-a.stats.sharpe;
          case "trades": return b.stats.trades-a.stats.trades;
          case "volume24h": return b.stats.volume24h-a.stats.volume24h;
          default: return 0;
        }
      });
  }, [dataset, market, search, sortKey, timeframe]);

  function toggleFollow(addr:string){ setFollows(prev=>({ ...prev, [addr]: !prev[addr] })); }

  const accent = "from-cyan-400 to-blue-500";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx("w-8 h-8 rounded-2xl bg-gradient-to-br", accent, "shadow-lg shadow-blue-500/20")} />
            <div className="font-semibold tracking-tight">Hyperliquid Social Signals</div>
            <Pill>Free • Signals-only</Pill>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <TabButton label="Home" active={activeTab==="home"} onClick={()=>setActiveTab("home")} />
            <TabButton label="Leaderboard" active={activeTab==="leaderboard"} onClick={()=>setActiveTab("leaderboard")} />
            <TabButton label="Alerts" active={activeTab==="alerts"} onClick={()=>setActiveTab("alerts")} />
            <TabButton label="About" active={activeTab==="about"} onClick={()=>setActiveTab("about")} />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* HOME / Landing */}
        {activeTab === "home" && (
          <section>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">A premium, simple dashboard for Hyperliquid traders</h1>
                <p className="text-white/70 mt-3 text-base">Discover top performers. Follow them. Get real-time signals on Telegram. No keys, no auto-execution.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href="#" onClick={(e)=>{e.preventDefault(); setActiveTab("leaderboard");}} className={clsx("px-4 py-2 rounded-xl bg-gradient-to-br", accent, "shadow-lg shadow-blue-500/20 text-sm")}>Open Leaderboard</a>
                  <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10">Subscribe on Telegram</a>
                  <a href={HYPERLIQUID_REF_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10">Trade on Hyperliquid (ref)</a>
                </div>
                <div className="mt-6 flex items-center gap-3 text-xs text-white/50">
                  <span>Free</span><span>•</span><span>Signals only</span><span>•</span><span>No affiliation with Hyperliquid</span>
                </div>
              </div>
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 overflow-hidden">
                <div className="text-xs text-white/60 mb-2">Preview</div>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="bg-white/5 p-3 text-sm text-white/70">Leaderboard (7d)</div>
                  <div className="divide-y divide-white/10">
                    {filtered.slice(0,5).map((t)=> (
                      <div key={t.address} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full" style={{ background: hashColor(t.address) }} />
                          <div className="text-sm">{t.handle ?? shortAddr(t.address)}</div>
                        </div>
                        <div className={clsx("text-sm", t.stats.pnlPct[timeframe]>=0?"text-emerald-300":"text-rose-300")}>{fmtPct(t.stats.pnlPct[timeframe])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <FeatureCard title="Smart Leaderboards" desc="Sort by PnL, win rate, Sharpe, and more across multiple timeframes." />
              <FeatureCard title="Trader Profiles" desc="PnL curves, positions, trade history, and a signals feed in one view." />
              <FeatureCard title="Instant Alerts" desc="Connect Telegram to get open/close/flip signals in real time." />
            </div>
          </section>
        )}

        {/* LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <section>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Leaderboard</h1>
                <p className="text-white/60 mt-1">Discover top performers. Follow them. Get signals (educational only).</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className={clsx("px-4 py-2 rounded-xl bg-gradient-to-br", accent, "hover:opacity-95 transition shadow-lg shadow-blue-500/20 text-sm")}>
                  Subscribe on Telegram
                </a>
                <a href={HYPERLIQUID_REF_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10">
                  Trade on Hyperliquid (ref)
                </a>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <SelectGroup label="Timeframe" value={timeframe} onChange={(v)=>setTimeframe(v as Timeframe)} options={["24h","7d","30d"]} />
              <SelectGroup label="Sort" value={sortKey} onChange={(v)=>setSortKey(v as SortKey)} options={["pnlPct","pnlUsd","winRate","sharpe","trades","volume24h"]} />
              <SelectGroup label="Market" value={market} onChange={(v)=>setMarket(v as Market)} options={["ALL","ETH","BTC","ALTS"]} />
              <div className="flex flex-col">
                <label className="text-xs text-white/60 mb-1">Search</label>
                <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Handle or address…" className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-white/60">
                    <Th>#</Th><Th>Trader</Th>
                    <Th right>PnL % ({timeframe})</Th><Th right>PnL $ ({timeframe})</Th>
                    <Th right>Win rate</Th><Th right>Sharpe</Th><Th right>Trades</Th><Th right>Vol 24h</Th>
                    <Th>Spark</Th><Th right>Follow</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t,i)=>(
                    <tr key={t.address} className="border-t border-white/10 hover:bg-white/[0.03] transition">
                      <Td>{i+1}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full" style={{ background: hashColor(t.address) }} />
                          <div>
                            <div className="font-medium">{t.handle ?? shortAddr(t.address)}</div>
                            <div className="text-[11px] text-white/50">{shortAddr(t.address)} • {t.marketFocus}</div>
                          </div>
                        </div>
                      </Td>
                      <Td right><span className={clsx(t.stats.pnlPct[timeframe]>=0 ? "text-emerald-400":"text-rose-400","font-medium")}>{fmtPct(t.stats.pnlPct[timeframe])}</span></Td>
                      <Td right>{fmtUsd(t.stats.pnlUsd[timeframe])}</Td>
                      <Td right>{fmtPct(t.stats.winRate*100,1)}</Td>
                      <Td right>{t.stats.sharpe.toFixed(2)}</Td>
                      <Td right>{t.stats.trades.toLocaleString()}</Td>
                      <Td right>{fmtUsd(t.stats.volume24h)}</Td>
                      <Td><Sparkline values={t.spark[timeframe]} /></Td>
                      <Td right>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={()=>setSelected(t)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">View</button>
                          <button onClick={()=> (setActiveTab("alerts"))}
                            className={"px-3 py-1.5 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10"}>
                            Follow
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-white/40 mt-3">Mock data for demo. Signals are educational only. Not financial advice. Not affiliated with Hyperliquid.</p>
          </section>
        )}

        {/* ALERTS */}
        {activeTab === "alerts" && (
          <section className="max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">Alerts</h2>
            <p className="text-white/60 mt-1">Connect Telegram to receive real-time signals when followed traders open, close, or flip positions.</p>
            <div className="mt-5 rounded-2xl border border-white/10 p-4 bg-white/5">
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-medium">Telegram</div><div className="text-white/60 text-xs">Not connected</div></div>
                <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer"
                   className={"px-4 py-2 rounded-xl text-sm border transition bg-white/5 border-white/10 hover:bg-white/10"}>
                  Connect
                </a>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl border border-white/10 p-4 bg-white/5">
                <div className="text-sm font-medium">Minimum position size</div>
                <div className="mt-2 flex items-center gap-2">
                  <input type="range" min={0} max={100000} step={1000} className="w-full" />
                  <div className="text-sm w-24 text-right">{fmtUsd(5000)}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 p-4 bg-white/5">
                <div className="text-sm font-medium">Symbols</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["ETH","BTC","SOL","DOGE","ARB","OP"].map(s=>(
                    <span key={s} className="px-3 py-1.5 rounded-full text-xs border bg-white/10 border-white/20">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <a href="#" className={clsx("px-4 py-2 rounded-xl bg-gradient-to-br", "from-cyan-400 to-blue-500", "text-sm shadow-lg shadow-blue-500/20")}>Save Preferences</a>
              <span className="text-xs text-white/50">Preferences are stored locally in this demo.</span>
            </div>
          </section>
        )}

        {/* ABOUT */}
        {activeTab === "about" && (
          <section className="max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">About</h2>
            <div className="mt-3 space-y-3 text-white/70 text-sm leading-relaxed">
              <p>This demo showcases a premium yet simple interface for exploring Hyperliquid traders and receiving signals. It uses mocked data and does not execute trades. In production, leaderboard and trader data would be fetched from Hyperliquid REST/WebSocket APIs and alerts would be sent via Telegram.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>No private keys or exchange API keys are required.</li>
                <li>Signals are for educational purposes only and are not financial advice.</li>
                <li>Not affiliated with or endorsed by Hyperliquid.</li>
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* Trader Slide-over (simplified demo) */}
      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setSelected(null)} />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-zinc-950 border-l border-white/10 p-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: hashColor(selected.address) }} />
                <div>
                  <div className="text-lg font-semibold">{selected.handle ?? shortAddr(selected.address)}</div>
                  <div className="text-[11px] text-white/50">{shortAddr(selected.address)} • Focus: {selected.marketFocus}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>setActiveTab("alerts")} className="px-3 py-1.5 rounded-lg border text-sm bg-white/5 border-white/10">Follow</button>
                <button onClick={()=>setSelected(null)} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">✕</button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 p-4 bg-white/5">
              <div className="text-sm font-medium mb-2">PnL curve ({timeframe})</div>
              <svg viewBox="0 0 640 160" className="w-full h-40">
                <path d={sparkPath(selected.spark[timeframe], 640, 160, 6)} fill="none" stroke="url(#grad)" strokeWidth={2.5} />
                <defs><linearGradient id="grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient></defs>
              </svg>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 p-4 bg-white/5">
              <div className="text-sm font-medium mb-2">Signals (demo)</div>
              <ul className="space-y-2">
                {selected.signals.map(s=>(
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white/80 text-sm">{s.event} • {s.symbol} {s.side} • {fmtUsd(s.sizeUsd)}</div>
                    <a className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10" href={HYPERLIQUID_REF_URL} target="_blank" rel="noreferrer">Open</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 pb-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-white/50 text-xs">
          <div>© {new Date().getFullYear()} Hyperliquid Social Signals — Demo UI. Premium feel, simple UX.</div>
          <div className="flex items-center gap-3"><span>Privacy-first</span><span>•</span><span>Signals only</span><span>•</span><span>Not financial advice</span></div>
        </div>
      </footer>
    </div>
  );
}
