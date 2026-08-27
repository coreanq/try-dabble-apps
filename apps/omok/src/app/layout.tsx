import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "오목 온라인 - 무료 AI 오목 게임 | Omok Online Free",
  description: "브라우저에서 바로 즐기는 무료 온라인 오목 게임. AI 대결(초급·중급·고급 3단계)과 2인 대결 모드를 지원합니다. 설치 없이 PC, 태블릿, 모바일에서 플레이하세요. Gomoku, 五目並べ.",
  keywords: [
    "오목", "오목 게임", "오목 온라인", "무료 오목", "오목 AI",
    "omok", "omok online", "omok game",
    "gomoku", "gomoku online", "gomoku AI", "gomoku free",
    "五目並べ", "五目並べ オンライン",
    "바둑판 게임", "보드게임", "전략게임", "2인 게임",
    "AI 보드게임", "온라인 보드게임", "무료 게임"
  ],
  authors: [{ name: "Omok AI" }],
  creator: "Omok AI",
  publisher: "Omok AI",
  applicationName: "오목",
  appleWebApp: {
    title: "오목",
  },
  category: "Games",
  classification: "Board Game",
  openGraph: {
    title: "오목 온라인 - 무료 AI 오목 게임 | Play Omok Free",
    description: "AI와 대결하거나 친구와 2인 대결! 설치 없이 브라우저에서 바로 즐기는 무료 오목 게임. 초급부터 고급까지 3단계 난이도.",
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US", "ja_JP"],
    siteName: "오목 온라인 | Omok Online",
    url: "https://omok.try-dabble.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "오목 온라인 - AI와 대결하는 무료 보드게임",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "오목 온라인 - 무료 AI 오목 게임",
    description: "AI 대결 & 2인 대결! 설치 없이 브라우저에서 바로 플레이. 초급·중급·고급 3단계 난이도.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://omok.try-dabble.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL('https://omok.try-dabble.com'),
  verification: {
    other: {
      "naver-site-verification": "1e2870c5315e69e1b748ad92e8402843386b763a",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '오목 온라인 - 무료 AI 오목 게임',
    alternateName: ['Omok Online', 'Gomoku Online', '五目並べ オンライン'],
    description: '브라우저에서 바로 즐기는 무료 온라인 오목 게임. AI 대결(초급·중급·고급)과 2인 대결 모드 지원. 설치 없이 PC, 태블릿, 모바일에서 플레이.',
    url: 'https://omok.try-dabble.com',
    applicationCategory: 'GameApplication',
    applicationSubCategory: 'Board Game',
    genre: ['Board Game', 'Strategy Game', 'Puzzle Game'],
    gamePlatform: ['Web Browser', 'Mobile Browser', 'Desktop Browser'],
    numberOfPlayers: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 2,
    },
    playMode: ['SinglePlayer', 'MultiPlayer'],
    inLanguage: ['ko', 'en', 'ja'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
    operatingSystem: 'Any',
    browserRequirements: 'Requires HTML5 Canvas support',
    featureList: [
      'AI 대결 모드 (초급, 중급, 고급)',
      '2인 대결 모드',
      '무르기 기능',
      '기보 검토',
      '반응형 디자인 (PC, 태블릿, 모바일)',
      '효과음',
    ],
    screenshot: 'https://omok.try-dabble.com/og-image.png',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '오목이란 무엇인가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '오목(五目, Gomoku)은 15×15 바둑판 위에서 두 명이 번갈아 돌을 놓아 가로, 세로, 대각선으로 5개를 연속으로 먼저 놓는 사람이 이기는 전략 보드게임입니다. 한국, 일본, 중국에서 오랜 역사를 가진 전통 게임입니다.',
        },
      },
      {
        '@type': 'Question',
        name: '이 오목 게임은 무료인가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '네, 완전 무료입니다. 회원가입이나 앱 설치 없이 웹 브라우저에서 바로 플레이할 수 있습니다. PC, 태블릿, 스마트폰 모두 지원합니다.',
        },
      },
      {
        '@type': 'Question',
        name: 'AI 난이도는 어떻게 되나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '초급, 중급, 고급 3단계 AI 난이도를 제공합니다. 초급은 오목 입문자에게, 중급은 기본 전략을 아는 플레이어에게, 고급은 숙련된 플레이어에게 적합합니다. 게임 중에도 난이도를 변경할 수 있습니다.',
        },
      },
      {
        '@type': 'Question',
        name: '2인 대결 모드는 어떻게 하나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '게임 시작 시 "2인 대결" 모드를 선택하면 한 기기에서 두 명이 번갈아가며 돌을 놓을 수 있습니다. 흑이 먼저 시작하며, 무르기 기능도 사용할 수 있습니다.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is Omok (Gomoku)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Omok (also known as Gomoku or 五目並べ) is a classic strategy board game played on a 15×15 grid. Two players take turns placing stones, and the first to get five in a row (horizontally, vertically, or diagonally) wins. This free online version offers AI opponents with 3 difficulty levels and a 2-player local mode.',
        },
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '오목 게임 하는 방법',
    description: '온라인 오목 게임을 시작하고 플레이하는 방법을 안내합니다.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: '게임 모드 선택',
        text: '웹사이트에 접속하면 AI 대결 또는 2인 대결 중 원하는 모드를 선택하세요.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: '돌 놓기',
        text: '바둑판의 원하는 위치를 클릭(터치)하여 돌을 놓으세요. 흑이 먼저 시작합니다.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: '승리 조건',
        text: '가로, 세로, 대각선 중 어느 방향이든 5개의 돌을 연속으로 먼저 놓으면 승리합니다.',
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="application-name" content="오목" />
        <meta name="apple-mobile-web-app-title" content="오목" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1343411537040925"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://fundingchoicesmessages.google.com/i/pub-1343411537040925?ers=1"
          strategy="afterInteractive"
        />
        <Script id="googlefc-present" strategy="afterInteractive">
          {`(function(){function signalGooglefcPresent(){if(!window.frames['googlefcPresent']){if(document.body){const iframe=document.createElement('iframe');iframe.style.cssText='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;';iframe.name='googlefcPresent';document.body.appendChild(iframe);}else{setTimeout(signalGooglefcPresent,0);}}}signalGooglefcPresent();})();`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Script
          src="https://try-dabble.com/widget/feedback.js"
          data-app="omok"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
