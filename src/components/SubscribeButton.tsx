'use client';

export default function SubscribeButton() {
  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session.');
      }
    } catch (err) {
      console.error('Stripe error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-semibold mt-6"
    >
      Subscribe Now
    </button>
  );
}
