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

/** Fallback metadata; locale layout overrides via generateMetadata. */
export const metadata: Metadata = {
  title: {
    default: "TravelAI",
    template: "%s · TravelAI",
  },
  description: "TravelAI — Vietnam & world travel planner",
  openGraph: {
    title: "TravelAI",
    description: "Plan smarter trips — Vietnam & the world",
    images: ["/images/brand/og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
