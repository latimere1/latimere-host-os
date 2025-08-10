'use client';

export default function HeroSection() {
  const scrollToDemo = () => {
    const demo = document.getElementById('demo');
    if (demo) {
      demo.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="text-center py-20 px-6 bg-[#121212]">
      <h2 className="text-4xl font-bold mb-4">
        Modern, Operator-First Platform for Short-Term Rentals
      </h2>
      <p className="max-w-2xl mx-auto mb-6 text-lg">
        Latimere Host OS helps owners and co-hosts manage properties, cleanings, and reporting —
        all from one easy-to-use platform.
      </p>
      <button
        onClick={scrollToDemo}
        className="bg-white text-black px-6 py-3 rounded font-bold hover:bg-cyan-300"
      >
        Request a Free Demo
      </button>
    </section>
  );
}
