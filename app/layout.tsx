// /app/layout.tsx
import type { Metadata } from "next";
import SupabaseProvider from "@/components/supabase-provider";
import "./globals.css";

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";

// Chunky pixel for brand/tabs
const mcFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mc",
});

// Readable pixel for body text
const pixelBody = Pixelify_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "EJ Blocks and Bots",
  description: "EJ Minecraft-inspired world of stories, science, and coding adventures!",
",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mcFont.variable} ${pixelBody.variable}`}> 
      <body className="bg-mc-grass text-mc-ink">
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
