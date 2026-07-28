import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const imageUrl = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: "Cadence · Understand what you play",
    description:
      "A MIDI-aware piano learning studio for classical repertoire, theory, improvisation, and composition.",
    openGraph: {
      title: "Cadence · Understand what you play",
      description:
        "Connect a MIDI keyboard, learn classical repertoire, and understand the harmony beneath every note.",
      type: "website",
      images: [{ url: imageUrl, width: 1730, height: 909, alt: "Cadence piano learning studio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cadence · Understand what you play",
      description:
        "A MIDI-aware piano learning studio for classical repertoire, theory, improvisation, and composition.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
