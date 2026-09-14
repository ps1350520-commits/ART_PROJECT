import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { META } from "@/content/site";
import "./globals.css";

const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

/**
 * Vercel supplies VERCEL_URL on every deployment, so social previews
 * resolve without any dashboard configuration.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, "")}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${META.title.th} — ${META.subtitle.th}`,
  description: META.heroLine.th,
  openGraph: {
    title: `${META.title.th} — ${META.title.en}`,
    description: META.heroLine.th,
    images: [{ url: "/photos/hero-front-quarter.jpg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
