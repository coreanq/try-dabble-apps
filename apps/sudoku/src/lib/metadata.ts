import type { Locale } from '@/lib/i18n/locales';
import { localizedFaq } from '@/lib/i18n';

const SITE_ORIGIN = 'https://sudoku.try-dabble.com';

const metadataCopy = {
  ko: {
    title: '3D 스도쿠 — 원목 보드에서 즐기는 숫자 퍼즐',
    description:
      '따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원하며 손가락·마우스·Apple Pencil로 플레이할 수 있습니다.',
    ogLocale: 'ko_KR',
    ogAlternateLocales: ['en_US', 'ja_JP'],
    ogImageAlt: '따뜻한 원목 보드와 세라믹 숫자 타일로 구성된 3D 스도쿠',
  },
  en: {
    title: '3D Sudoku — A Tactile Number Puzzle',
    description:
      'Play tactile 3D Sudoku on a warm wooden board with ceramic tiles, five rated difficulty levels, notes, undo, answer checking, and Pencil or finger controls.',
    ogLocale: 'en_US',
    ogAlternateLocales: ['ko_KR', 'ja_JP'],
    ogImageAlt: 'A tactile 3D Sudoku board made from warm wood and ceramic number tiles',
  },
  ja: {
    title: '3D数独 — 木製ボードで楽しむ数字パズル',
    description:
      '温かな木製ボードとセラミックの数字タイルで楽しむ3D数独です。5段階の難易度、メモ、取り消し、答え合わせに対応し、指・マウス・Apple Pencilのどれでも遊べます。',
    ogLocale: 'ja_JP',
    ogAlternateLocales: ['ko_KR', 'en_US'],
    ogImageAlt: '温かな木製ボードとセラミックの数字タイルで作られた3D数独',
  },
} as const satisfies Record<
  Locale,
  {
    readonly title: string;
    readonly description: string;
    readonly ogLocale: string;
    readonly ogAlternateLocales: readonly string[];
    readonly ogImageAlt: string;
  }
>;

const alternates = {
  ko: `${SITE_ORIGIN}/?lang=ko`,
  en: `${SITE_ORIGIN}/?lang=en`,
  ja: `${SITE_ORIGIN}/?lang=ja`,
  'x-default': SITE_ORIGIN,
} as const;

export interface LocaleMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly alternates: typeof alternates;
  readonly ogImage: string;
  readonly ogImageAlt: string;
  readonly ogLocale: string;
  readonly ogAlternateLocales: readonly string[];
  readonly faq: ReturnType<typeof localizedFaq>;
  readonly manifest: string;
}

export function localeMetadata(locale: Locale): LocaleMetadata {
  const copy = metadataCopy[locale];

  return {
    ...copy,
    canonical: `${SITE_ORIGIN}/?lang=${locale}`,
    alternates,
    ogImage: `/og/${locale}.png`,
    faq: localizedFaq(locale),
    manifest: `/manifest.${locale}.webmanifest`,
  };
}

export function faqJsonLdFor(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: localizedFaq(locale).map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  } as const;
}
