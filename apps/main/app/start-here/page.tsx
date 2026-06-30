import Link from 'next/link';

const roadmapSteps = [
  {
    step: 1,
    title: 'Read this page',
    description: "Start by reading through this introduction \u2014 it\u2019s designed to be short, gentle, and non-clinical.",
    href: null,
  },
  {
    step: 2,
    title: 'Learn about CPTSD',
    description: 'Explore our educational articles about complex trauma, emotional neglect, and how they show up in Indian contexts.',
    href: '/learn',
    cta: 'Go to Learn →',
  },
  {
    step: 3,
    title: 'Browse daily-life topics',
    description: 'See how CPTSD traits show up in everyday life — work, relationships, the body, emotions.',
    href: '/live',
    cta: 'Go to Live →',
  },
  {
    step: 4,
    title: 'Explore resources',
    description: 'Find helplines, therapy directories, books, and communities curated for the Indian context.',
    href: '/resources',
    cta: 'Go to Resources →',
  },
  {
    step: 5,
    title: 'If you feel unsafe',
    description: 'If you are in crisis or feeling overwhelmed, please reach out to a mental health helpline.',
    href: '/support#helplines',
    cta: 'See helplines →',
    highlight: true,
  },
];

export default function StartHerePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-on-surface mb-4">Start Here</h1>
      <p className="text-xl text-on-surface-variant mb-12 leading-relaxed">
        Not sure where to begin? This page is your guided entry point into understanding CPTSD and finding support.
      </p>

      {/* ── Roadmap ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-on-surface mb-8">Your path through this site</h2>
        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-surface-container-high hidden sm:block" aria-hidden="true" />
          <ol className="space-y-6">
            {roadmapSteps.map((s) => (
              <li key={s.step} className="relative sm:pl-16">
                {/* Step number bubble */}
                <div
                  className="hidden sm:flex absolute left-0 top-0 w-12 h-12 rounded-full items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}
                  aria-hidden="true"
                >
                  {s.step}
                </div>
                <div
                  className={`rounded-xl p-6 ${s.highlight ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}
                  style={{ boxShadow: 'var(--shadow-ambient)' }}
                >
                  <div className="flex items-center gap-3 mb-2 sm:hidden">
                    <span
                      className="flex w-8 h-8 rounded-full items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}
                    >
                      {s.step}
                    </span>
                    <h3 className="text-lg font-semibold text-on-surface">{s.title}</h3>
                  </div>
                  <h3 className="hidden sm:block text-lg font-semibold text-on-surface mb-2">{s.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{s.description}</p>
                  {s.href && (
                    <Link href={s.href} className="inline-block mt-3 text-primary font-medium text-sm hover:text-primary-container">
                      {s.cta}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-4">
            You're not "too weak" or "too dramatic"
          </h2>
          <p className="text-on-surface text-lg leading-relaxed mb-4">
            Many people in India grow up hearing "everyone has problems", "forget it and move on".
            If you lived with long-term emotional neglect, criticism, fear or chaos, your nervous
            system can adapt in ways that show up later as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-on-surface text-lg mb-4">
            <li>feeling constantly on edge,</li>
            <li>shutting down or going numb,</li>
            <li>intense shame and self-blame,</li>
            <li>relationship patterns that feel stuck or chaotic.</li>
          </ul>
          <p className="text-on-surface-variant italic">
            This is an explanation, not a diagnosis. Only a trained professional can give a formal
            diagnosis.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-4">
            PTSD vs Complex PTSD (CPTSD)
          </h2>
          <p className="text-on-surface text-lg leading-relaxed mb-4">
            <strong>PTSD</strong> often follows a <strong>single or few traumatic events</strong>{' '}
            (accident, assault, disaster).
          </p>
          <p className="text-on-surface text-lg leading-relaxed mb-4">
            <strong>CPTSD</strong> is more often linked to <strong>long-term, repeated trauma</strong>
            , especially starting in childhood (e.g. chronic abuse, neglect, exposure to violence,
            captivity, war, institutional trauma).
          </p>
          <p className="text-on-surface text-lg leading-relaxed mb-4">
            In CPTSD, people typically experience:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-on-surface text-lg mb-4">
            <li>
              <strong>PTSD-type symptoms</strong> (flashbacks, nightmares, avoiding reminders, feeling
              constantly threatened).
            </li>
            <li>
              <strong>PLUS difficulties with:</strong>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>emotions (too much / too little),</li>
                <li>self-worth (deep shame, "I am broken/bad"),</li>
                <li>
                  relationships (difficulty trusting, feeling safe, or keeping stable connections).
                </li>
              </ul>
            </li>
          </ul>
          <div className="bg-surface-container-high border-l-4 border-primary-container p-4 rounded-xl">
            <p className="text-on-surface">
              <strong>Always emphasise:</strong> only a trained professional can give a formal
              diagnosis; reading about CPTSD is about understanding patterns, not labelling
              yourself.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-4">
            "Does this sound familiar?" (reflection, not diagnosis)
          </h2>
          <p className="text-on-surface text-lg leading-relaxed mb-4">
            Here are some optional reflection prompts. Treat these as prompts, not a checklist:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-on-surface text-lg">
            <li>"I often feel like I'm still that scared child, even though I'm an adult."</li>
            <li>
              "I minimise what happened to me because 'others had it worse', but my body reacts
              strongly anyway."
            </li>
            <li>
              "When someone is kind to me, I don't know how to receive it or I feel suspicious."
            </li>
            <li>"I swing between feeling too much and feeling nothing."</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-4">Where to go next</h2>
          <div className="space-y-3">
            <Link
              href="/learn"
              className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-6 py-4 no-underline hover:bg-surface-variant transition-colors group"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <div>
                <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">Learn more about CPTSD</p>
                <p className="text-sm text-on-surface-variant mt-0.5">Articles, explainers, and educational resources</p>
              </div>
              <span className="text-primary text-xl ml-4 shrink-0">→</span>
            </Link>
            <Link
              href="/live"
              className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-6 py-4 no-underline hover:bg-surface-variant transition-colors group"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <div>
                <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">Explore daily-life topics</p>
                <p className="text-sm text-on-surface-variant mt-0.5">Work, relationships, emotions, body</p>
              </div>
              <span className="text-primary text-xl ml-4 shrink-0">→</span>
            </Link>
            <Link
              href="/support#helplines"
              className="flex items-center justify-between bg-surface-container-high rounded-xl px-6 py-4 no-underline hover:bg-surface-variant transition-colors group"
            >
              <div>
                <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">If you feel overwhelmed or unsafe</p>
                <p className="text-sm text-on-surface-variant mt-0.5">Indian mental health helplines and crisis options</p>
              </div>
              <span className="text-primary text-xl ml-4 shrink-0">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
