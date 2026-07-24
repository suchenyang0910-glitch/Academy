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
  const imageUrl = `${protocol}://${host}/og-v2.png`;

  return {
    title: "Academy · 学习监督系统",
    description: "每天投喂、监督、反馈，并留下真实能力证据。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Academy · 学习监督系统",
      description: "今天不要求逆袭，只要求别继续原地踏步。",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "Academy 学习监督系统" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Academy · 学习监督系统",
      description: "今天不要求逆袭，只要求别继续原地踏步。",
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
