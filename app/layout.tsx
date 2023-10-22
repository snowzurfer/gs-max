import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GS-MAX",
  description:
    "As long as the Sun, the Moon, and the Earth exist, everything will be all right.",
};

export const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.className,
          "flex h-screen flex-col items-center justify-center",
          "bg-gradient-to-br from-white to-gray-100",
          "dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800"
        )}
      >
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
