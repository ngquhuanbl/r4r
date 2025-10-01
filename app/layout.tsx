import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "",
  description: "",
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
