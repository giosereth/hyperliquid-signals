// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyper Signal",
  description: "Premium signals and leaderboards powered by Hyperliquid",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}