import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'vi', 'es', 'fr', 'de', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // Get locale from cookie (default to 'en')
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale;
  const validLocale = locales.includes(locale) ? locale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});
