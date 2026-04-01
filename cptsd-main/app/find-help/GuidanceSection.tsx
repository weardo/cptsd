import Link from 'next/link';

export default function GuidanceSection() {
  const cards = [
    {
      href: '/start-here',
      title: 'New to CPTSD?',
      description: 'A guided introduction to understanding complex trauma',
      arrow: 'Start here →',
    },
    {
      href: '/learn',
      title: 'Learn about CPTSD',
      description: 'Educational articles about trauma, healing, and recovery',
      arrow: 'Explore topics →',
    },
    {
      href: '/support',
      title: 'All support resources',
      description: 'Books, communities, educational sites, and more',
      arrow: 'View resources →',
    },
  ];

  return (
    <section className="bg-surface-container-low py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <h2 className="font-serif text-3xl font-bold text-on-surface mb-4">
            Not sure where to start?
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            It can feel overwhelming to know where to begin. These three paths can help you
            orient — whether you are new to the idea of complex trauma, looking for something
            specific to learn, or searching for practical support.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-surface-container-lowest rounded-xl p-6 flex flex-col no-underline hover:bg-surface-variant transition-colors"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <h3 className="text-xl font-semibold text-on-surface mb-2">{card.title}</h3>
              <p className="text-on-surface-variant leading-relaxed flex-1">{card.description}</p>
              <span className="text-primary font-medium text-sm mt-4">{card.arrow}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
