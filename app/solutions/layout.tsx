import type { Metadata } from "next";

// Open Graph metadata cho trang Solutions
// Hỗ trợ hiển thị thumbnail và mô tả khi share qua Zalo/Messenger
export const metadata: Metadata = {
  title: "Partner Center - AI-Powered Partner Relationship Management",
  description: "Never miss a critical update. Never waste time. Never miss a sales opportunity. Partner Center bypasses social media algorithms to ensure 100% visibility of updates from your business-critical contacts.",
  openGraph: {
    title: "Partner Center - AI-Powered Partner Relationship Management",
    description: "Never miss a critical update. Never waste time. Never miss a sales opportunity. Partner Center bypasses social media algorithms to ensure 100% visibility of updates from your business-critical contacts.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/solutions`
      : "https://partner-center.app/solutions",
    siteName: "Partner Center",
    images: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`
          : "https://partner-center.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Partner Center - AI-Powered Partner Relationship Management",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Center - AI-Powered Partner Relationship Management",
    description: "Never miss a critical update. Never waste time. Never miss a sales opportunity.",
    images: [
      process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`
        : "https://partner-center.app/og-image.png",
    ],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/solutions`
      : "https://partner-center.app/solutions",
  },
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

