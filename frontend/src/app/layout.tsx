import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapSave Pro | Premium Social Media Downloader",
  description: "Download high-quality Instagram Reels, Photos, and YouTube Videos instantly in up to 4K resolution with SnapSave Pro.",
  keywords: ["Instagram Downloader", "YouTube Downloader", "Reels Downloader", "Video Downloader", "4K Video Download", "SnapSave", "SnapSave Pro"],
  authors: [{ name: "Ahmad" }],
  openGraph: {
    title: "SnapSave Pro | Premium Social Media Downloader",
    description: "Download high-quality Instagram Reels, Photos, and YouTube Videos instantly in up to 4K resolution.",
    url: "https://snapsave.pro", // Placeholder domain
    siteName: "SnapSave Pro",
    images: [
      {
        url: "/globe.svg", // Placeholder for actual OG image
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapSave Pro | Premium Social Media Downloader",
    description: "Download high-quality Instagram Reels, Photos, and YouTube Videos instantly.",
    creator: "@thisisahmad07",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
