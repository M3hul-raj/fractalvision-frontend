import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react"; // 1. ADDED IMPORT

export const metadata: Metadata = {
  metadataBase: new URL("https://fractalvision.vercel.app"),
  title: {
    default: "FractalVision Lab",
    template: "%s | FractalVision Lab",
  },
  description:
    "An interactive scientific tool for computing fractal dimensions of natural patterns using the box-counting method — underpinned by original academic research in fractal geometry.",
  keywords: [
    "fractal dimension", "box-counting", "fractal geometry",
    "image analysis", "natural patterns", "mathematics",
    "scientific visualization", "Koch curve", "Sierpinski",
  ],
  openGraph: {
    type: "website",
    url: "https://fractalvision.vercel.app",
    title: "FractalVision Lab — Interactive Fractal Dimension Analyzer",
    description:
      "Upload leaves, coastlines, or natural textures and watch their fractal dimension emerge through live box-counting and mathematical visualization.",
    siteName: "FractalVision Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "FractalVision Lab",
    description:
      "Compute fractal dimensions of natural patterns using the box-counting method.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <Navbar />
        {children}
        <Footer />
        <Analytics /> {/* 2. ADDED COMPONENT */}
      </body>
    </html>
  );
}