import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RegGuard AI — Regulatory Compliance Automator",
  description: "Automated compliance monitoring for banks, insurers, pharma, and hospitals. Track regulation changes, auto-update policies, and generate immutable audit trails.",
  keywords: ["regtech", "compliance", "regulatory", "AML", "MiFID II", "HIPAA", "GDPR", "AI Act", "Basel III"],
  authors: [{ name: "RegGuard AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "RegGuard AI — Regulatory Compliance Automator",
    description: "Automated compliance monitoring across 8 jurisdictions for banks, insurers, pharma, and hospitals.",
    url: "https://chat.z.ai",
    siteName: "RegGuard AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RegGuard AI — Regulatory Compliance Automator",
    description: "Automated compliance monitoring across 8 jurisdictions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
