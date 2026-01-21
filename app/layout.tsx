import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CareerProvider } from "@/context/CareerContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Career Agent",
  description: "Reasoning-first career coach.",
};

// Allow up to 60 seconds for processing (Vercel Pro / Hobby Limit handling)
export const maxDuration = 60;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased min-h-screen bg-background text-foreground")}>
        <CareerProvider>
          {children}
        </CareerProvider>
      </body>
    </html>
  );
}
