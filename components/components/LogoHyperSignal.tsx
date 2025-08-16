"use client";
import * as React from "react";

type Props = {
  /** Pixel size of the square logo mark */
  size?: number;
  /** Extra classes for the outer <svg> */
  className?: string;
};

export default function LogoHyperSignal({ size = 28, className }: Props) {
  const id = React.useId(); // avoid gradient/filter id collisions
  const gid = `grad-${id}`;
  const fid = `glow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="Hyper Signal logo"
      role="img"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rounded square */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill={`url(#${gid})`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1.25"
      />

      {/* Subtle grid notch (premium touch) */}
      <path
        d="M10 46 H54 M10 34 H54"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Sparkline */}
      <path
        d="M10 44 L20 34 L28 38 L36 26 L46 30 L54 20"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        filter={`url(#${fid})`}
        opacity="0.95"
      />

      {/* Minimal candlesticks */}
      {/* Bull */}
      <line x1="24" x2="24" y1="22" y2="42" stroke="white" strokeOpacity="0.7" />
      <rect x="21" y="28" width="6" height="10" rx="1.5" fill="white" opacity="0.8" />
      {/* Bear */}
      <line x1="44" x2="44" y1="18" y2="40" stroke="white" strokeOpacity="0.45" />
      <rect x="41" y="24" width="6" height="8" rx="1.5" fill="white" opacity="0.55" />
    </svg>
  );
}

/** Wordmark helper to show the logo + text inline */
export function HyperSignalWordmark({
  size = 28,
  text = "Hyper Signal",
  className,
  textClassName = "font-semibold tracking-tight",
}: {
  size?: number;
  text?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoHyperSignal size={size} />
      <span className={textClassName}>{text}</span>
    </span>
  );
}
