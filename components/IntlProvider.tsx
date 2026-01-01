"use client";

import { NextIntlClientProvider } from "next-intl";

interface IntlProviderProps {
  messages: any;
  locale: string;
  children: React.ReactNode;
}

export function IntlProvider({ messages, locale, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}

