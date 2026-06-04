import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FractalVision Lab",
  description:
    "Interactive Fractal Dimension Analyzer for Natural Patterns — upload leaves, coastlines, or natural textures and watch their fractal dimension emerge through box-counting and live mathematical visualization.",
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
      </body>
    </html>
  );
}
