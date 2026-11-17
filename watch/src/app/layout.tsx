import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOD'S EYE // BLACKOUT WATCH — Global System Malfunction Overlay",
  description:
    "God's Eye-style event overlay: verified global electronic system malfunctions, 11 Oct – 17 Nov 2026, on a time-scrubbing 3D globe. Inspired by the open-source God's Eye View project.",
  keywords: ["God's Eye", "outage tracker", "cyberattack", "Downdetector", "globe", "OSINT", "timeline"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "GOD'S EYE // BLACKOUT WATCH",
    description: "Global electronic system malfunction overlay with time scrubber",
    siteName: "Blackout Watch",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
