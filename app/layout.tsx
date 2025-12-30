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
    default: "Bay State Pet & Garden Supply",
    template: "%s | Bay State Pet & Garden",
  },
  description: "Your local source for pet supplies, garden tools, and farm products. Family-owned and serving the community with quality products and neighborly service.",
  keywords: ["pet supplies", "garden tools", "farm products", "pet food", "garden center", "Massachusetts"],
  authors: [{ name: "Bay State Pet & Garden Supply" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bay State P&G",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Bay State Pet & Garden Supply",
    title: "Bay State Pet & Garden Supply",
    description: "Your local source for pet supplies, garden tools, and farm products. Family-owned and serving the community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bay State Pet & Garden Supply",
    description: "Your local source for pet supplies, garden tools, and farm products.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
