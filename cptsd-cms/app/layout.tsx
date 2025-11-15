import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/Sidebar";
import SidebarProvider from "@/components/SidebarProvider";
import SidebarContent from "@/components/SidebarContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPTSD CMS - Content Management",
  description: "Content management system for CPTSD awareness project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <SidebarProvider>
            <Sidebar />
            <SidebarContent>{children}</SidebarContent>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
