import Link from 'next/link';

export default function StartHerePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Start Here</h1>

      <div className="prose prose-lg max-w-none">
        {/* Section 1 – You're not "too weak" or "too dramatic" */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            You're not "too weak" or "too dramatic"
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Many people in India grow up hearing "everyone has problems", "forget it and move on".
            If you lived with long-term emotional neglect, criticism, fear or chaos, your nervous
            system can adapt in ways that show up later as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg mb-4">
            <li>feeling constantly on edge,</li>
            <li>shutting down or going numb,</li>
            <li>intense shame and self-blame,</li>
            <li>relationship patterns that feel stuck or chaotic.</li>
          </ul>
          <p className="text-gray-600 italic">
            This is an explanation, not a diagnosis. Only a trained professional can give a formal
            diagnosis.
          </p>
        </section>

        {/* Section 2 – PTSD vs Complex PTSD (CPTSD) */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            PTSD vs Complex PTSD (CPTSD)
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            <strong>PTSD</strong> often follows a <strong>single or few traumatic events</strong>{' '}
            (accident, assault, disaster).
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            <strong>CPTSD</strong> is more often linked to <strong>long-term, repeated trauma</strong>
            , especially starting in childhood (e.g. chronic abuse, neglect, exposure to violence,
            captivity, war, institutional trauma).
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            In CPTSD, people typically experience:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg mb-4">
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
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p className="text-gray-700">
              <strong>Always emphasise:</strong> only a trained professional can give a formal
              diagnosis; reading about CPTSD is about understanding patterns, not labelling
              yourself.
            </p>
          </div>
        </section>

        {/* Section 3 – "Does this sound familiar?" */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            "Does this sound familiar?" (reflection, not diagnosis)
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Here are some optional reflection prompts. Treat these as prompts, not a checklist:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-gray-700 text-lg">
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

        {/* Section 4 – Where to go next */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Where to go next</h2>
          <div className="space-y-4">
            <Link
              href="/learn"
              className="btn btn-primary block text-center"
            >
              Learn more about CPTSD
            </Link>
            <Link
              href="/live"
              className="btn btn-secondary block text-center"
            >
              Explore daily-life topics
            </Link>
            <Link
              href="/support#helplines"
              className="btn btn-accent block text-center"
            >
              If you feel overwhelmed or unsafe
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
