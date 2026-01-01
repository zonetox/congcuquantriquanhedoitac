// Export locales and Locale type for use throughout the app
export { locales, type Locale } from './i18n/config';

// Config for next-intl - required for build-time
// We use manual message loading in app/layout.tsx, but next-intl still needs this export
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './i18n/config';

// Import messages statically to avoid build-time issues
import enMessages from './messages/en.json';

export default getRequestConfig(async () => {
  // Return default config with English messages
  // Actual locale and messages are handled dynamically in app/layout.tsx
  // This is just to satisfy next-intl's build-time requirements
  return {
    locale: 'en' as Locale,
    messages: enMessages
  };
});

