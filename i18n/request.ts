export const locales = ['en', 'vi', 'es', 'fr', 'de', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];
