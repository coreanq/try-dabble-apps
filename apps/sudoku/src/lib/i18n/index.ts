import type { Locale } from '@/lib/i18n/locales';

import en from './en.ts';
import ja from './ja.ts';
import ko from './ko.ts';
import type { MessageDictionary, MessageKey } from './messages.ts';

export type { MessageKey } from './messages.ts';

const FAQ_MESSAGE_KEYS = [
  ['faqOneQuestion', 'faqOneAnswer'],
  ['faqTwoQuestion', 'faqTwoAnswer'],
  ['faqThreeQuestion', 'faqThreeAnswer'],
] as const satisfies readonly (readonly [MessageKey, MessageKey])[];

export const messages = {
  ko,
  en,
  ja,
} as const satisfies Record<Locale, MessageDictionary>;

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function localizedFaq(locale: Locale) {
  return FAQ_MESSAGE_KEYS.map(([questionKey, answerKey]) => ({
    question: t(locale, questionKey),
    answer: t(locale, answerKey),
  }));
}
