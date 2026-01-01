import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

// Import messages statically to avoid build-time issues
import enMessages from '../messages/en.json';

export default getRequestConfig(async () => {
  // Return default config with English messages
  // Actual locale and messages are handled dynamically in app/layout.tsx
  // This is just to satisfy next-intl's build-time requirements
  return {
    locale: 'en' as Locale,
    messages: enMessages
  };
});

