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
    if (process.env.NODE_ENV === "development") {
      console.error("[RootLayout] Error getting user locale:", error);
    }
    try {
      const cookieStore = await cookies();
      const cookieLocale = cookieStore.get("locale")?.value;
      if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        locale = cookieLocale as Locale;
      }
    } catch (cookieError) {
      // If cookie access fails, use default
      if (process.env.NODE_ENV === "development") {
        console.error("[RootLayout] Error accessing cookies:", cookieError);
      }
    }
  }
  
  const validLocale = locales.includes(locale) ? locale : "en";
  
  // Load messages dynamically with error handling
  let messages: any;
  try {
    messages = (await import(`../messages/${validLocale}.json`)).default;
  } catch (importError) {
    // If import fails, try to load English as fallback
    if (process.env.NODE_ENV === "development") {
      console.error(`[RootLayout] Error loading messages for locale ${validLocale}:`, importError);
    }
    try {
      messages = (await import(`../messages/en.json`)).default;
    } catch (fallbackError) {
      // If even English fails, use empty object
      if (process.env.NODE_ENV === "development") {
        console.error("[RootLayout] Error loading fallback messages:", fallbackError);
      }
      messages = {};
    }
  }

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

