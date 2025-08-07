export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-6 text-center">
      <h3 className="text-3xl font-bold mb-6">What You Can Do Today</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <li>🏠 Create and manage properties and units</li>
        <li>🧹 Schedule and track cleanings</li>
        <li>✅ Mark cleanings as complete</li>
        <li>📅 View upcoming cleanings in calendar view</li>
        <li>📊 Track projected monthly revenue per unit</li>
        <li>📁 View property details and dashboards</li>
      </ul>
    </section>
  );
}
