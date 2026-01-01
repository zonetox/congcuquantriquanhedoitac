import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, type Locale } from './i18n/config';

export { locales, type Locale } from './i18n/config';

export default getRequestConfig(async () => {
  // Get locale from cookie (default to 'en')
  let locale: Locale = 'en';
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale as Locale;
    }
  } catch (error) {
    // If cookie access fails, use default
    if (process.env.NODE_ENV === "development") {
      console.error("[i18n] Error accessing cookies:", error);
    }
  }

  const validLocale = locales.includes(locale) ? locale : 'en';

  // Load messages with error handling
  let messages: any;
  try {
    messages = (await import(`./messages/${validLocale}.json`)).default;
  } catch (error) {
    // If import fails, try to load English as fallback
    if (process.env.NODE_ENV === "development") {
      console.error(`[i18n] Error loading messages for locale ${validLocale}:`, error);
    }
    try {
      messages = (await import(`./messages/en.json`)).default;
    } catch (fallbackError) {
      // If even English fails, use empty object
      if (process.env.NODE_ENV === "development") {
        console.error("[i18n] Error loading fallback messages:", fallbackError);
      }
      messages = {};
    }
  }

  return {
    locale: validLocale,
    messages
  };
});

