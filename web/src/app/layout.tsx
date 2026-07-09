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
  title: {
    default: "TravelAI — Lên kế hoạch chuyến đi thông minh",
    template: "%s · TravelAI",
  },
  description:
    "TravelAI — du lịch Việt Nam & thế giới, khách sạn, tour, chuyến bay mock, AI trip planner.",
  openGraph: {
    title: "TravelAI",
    description: "Lên kế hoạch chuyến đi thông minh — Việt Nam & Thế giới",
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
