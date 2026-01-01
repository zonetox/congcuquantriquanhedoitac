// Export locales and Locale type for use throughout the app
export { locales, type Locale } from './i18n/config';

// Config for next-intl - MUST be in root i18n.ts file
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './i18n/config';
import enMessages from './messages/en.json';

export default getRequestConfig(async () => {
  return {
    locale: 'en' as Locale,
    messages: enMessages
  };
});

