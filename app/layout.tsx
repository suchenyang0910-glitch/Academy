import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Academy · 私人学习手账",
    description: "把每天的课程、笔记与进度收进一处，随时回看。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Academy · 私人学习手账",
      description: "把每天的学习，收进一本手账。",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "Academy 私人学习手账" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Academy · 私人学习手账",
      description: "把每天的学习，收进一本手账。",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
