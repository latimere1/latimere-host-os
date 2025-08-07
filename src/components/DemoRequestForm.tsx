import { useState } from 'react';

export default function DemoRequestForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('Submitting...');

    try {
      const res = await fetch(
        'https://qh921m7woa.execute-api.us-east-1.amazonaws.com/prod/join-waitlist',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error('Network response failed');

      setMessage('✅ Thanks! Your demo request has been received — we’ll be in touch shortly.');
      setForm({ name: '', phone: '', email: '' });
    } catch (err) {
      console.error(err);
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 max-w-md mx-auto">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name"
          required
          className="w-full px-4 py-2 rounded text-black"
        />
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
          className="w-full px-4 py-2 rounded text-black"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address"
          required
          className="w-full px-4 py-2 rounded text-black"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-semibold"
        >
          {submitting ? 'Submitting…' : 'Request Demo'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm font-medium">{message}</p>}
    </>
  );
}
