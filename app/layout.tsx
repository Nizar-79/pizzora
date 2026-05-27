import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "@/components/ConditionalSidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pizzora — Voice AI Ordering",
  description: "Voice AI ordering system for pizzerias powered by Claude AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="flex h-screen bg-background font-sans antialiased">
        <ConditionalSidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}
