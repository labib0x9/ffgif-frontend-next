import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "FFgif - High-Performance Video to GIF Converter & Studio",
  description:
    "Convert videos to ultra-high-quality GIFs asynchronously with customizable FPS, precision trimming, direct cloud storage upload, and instant sharing.",
  keywords: ["video to gif", "gif converter", "fast gif maker", "mp4 to gif", "ffmpeg gif", "minio upload"],
  authors: [{ name: "FFgif Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
