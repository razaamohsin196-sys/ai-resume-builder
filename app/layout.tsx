import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CareerProvider } from "@/context/CareerContext";
import { UUIDProvider } from "@/components/providers/UUIDProvider";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
                  crypto.randomUUID = function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0;
                      var v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cn(inter.className, "antialiased min-h-screen bg-background text-foreground")}>
        <UUIDProvider>
          <CareerProvider>
            {children}
          </CareerProvider>
        </UUIDProvider>
      </body>
    </html>
  );
}
