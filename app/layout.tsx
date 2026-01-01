import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import { locales, type Locale } from "@/i18n/request";
import { getUserLocale } from "@/lib/user/actions";

export const metadata: Metadata = {
  title: "Partner Relationship Management",
  description: "Networking Dashboard for Partner Relationship Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to get locale from database first (if user is logged in)
  let locale: Locale = "en";
  try {
    locale = await getUserLocale();
  } catch (error) {
    // If error, fallback to cookie
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("locale")?.value;
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale as Locale;
    }
  }
  
  const validLocale = locales.includes(locale) ? locale : "en";
  
  // Load messages dynamically
  const messages = (await import(`../messages/${validLocale}.json`)).default;

  return (
    <html lang={validLocale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={validLocale}>
          {children}
        </NextIntlClientProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

