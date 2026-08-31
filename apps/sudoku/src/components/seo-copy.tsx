import { localizedFaq } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The FAQ answer engines quote. Rendered as real text AND as FAQPage JSON-LD,
 * because ChatGPT and AI Overviews read the markup, not the canvas.
 */
export function SeoCopy({ locale, heading }: { readonly locale: Locale; readonly heading: string }) {
  const faq = localizedFaq(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8 text-ink-muted">
      <h2 className="font-display text-lg text-ink">{heading}</h2>
      <dl className="mt-4 space-y-4">
        {faq.map((entry) => (
          <div key={entry.question}>
            <dt className="text-sm font-semibold text-ink">{entry.question}</dt>
            <dd className="mt-1 text-sm">{entry.answer}</dd>
          </div>
        ))}
      </dl>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </section>
  );
}
