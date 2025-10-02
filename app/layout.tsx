import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";
import type { Metadata } from "next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  openGraph: {
    images: {
      url: "/shared/og-image.jpg",
      alt: `Logo for Review4Review. The design features two intersecting speech bubbles with a star icon inside each one. The tagline "A business to business review network" is written below the main logo.`,
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    images: {
      url: "/shared/twt-image.jpg",
      alt: `Logo for Review4Review. The design features two intersecting speech bubbles with a star icon inside each one. The tagline "A business to business review network" is written below the main logo.`,
      width: 1200,
      height: 630,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          GeistSans.className
        )}
      >
        <div
          id="main-container"
          className="flex flex-col min-h-screen text-black dark:text-white bg-white dark:bg-black"
        >
          <Toaster />
          {children}
        </div>
      </body>
    </html>
  );
}
