import type { Metadata } from "next";
import { Bree_Serif, Chivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const breeSerif = Bree_Serif({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const chivo = Chivo({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prologue",
  description: "AI-led UX interviews with automatic analysis",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${breeSerif.variable} ${chivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F4F4] text-black font-body">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
