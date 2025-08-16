import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyper Signal",
  description: "Premium signals and leaderboards powered by Hyperliquid",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="flex items-center gap-3 p-4">
          {/* Old logo/text block here */}
          <div className="w-8 h-8 bg-blue-500 rounded-xl" />
          <div className="font-semibold">Hyperliquid Signals</div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

