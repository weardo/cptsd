export default function HeroSection() {
  return (
    <section className="bg-surface-container-low py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface mb-6">
            Find your path to healing
          </h1>
          <p className="text-xl text-on-surface leading-relaxed mb-8">
            Whether you need to talk to someone right now, find a therapist who understands trauma,
            or simply connect with support communities — this page brings those resources together
            in one place. You do not have to search alone.
          </p>
          <div className="bg-surface-container-high border-l-4 border-primary-container p-6 rounded-xl">
            <p className="text-on-surface leading-relaxed">
              <strong>This is not an emergency service.</strong> The resources listed here are for
              non-emergency mental health support. If you or someone you know is in immediate danger,
              please call <strong>112</strong> (India emergency number) or go to your nearest
              emergency room right away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
