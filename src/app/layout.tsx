import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthHeader } from "@/components/layout/AuthHeader";
import "./globals.css";

const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Levelr - Construction Bid Analysis Platform",
  description: "Secure construction bid analysis platform with CSI division benchmarking and market variance analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthHeader />
        {children}
      </body>
    </html>
  );

  if (isAuthEnabled) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
