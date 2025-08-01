// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import PropertyList   from "./components/PropertyList";   // list + add/edit/delete
import PropertyDetail from "./pages/PropertyDetail";      // nested Units view
// import other pages as you build them

export default function App() {
  return (
    <Router>
      {/* ───── Top navigation ───── */}
      <nav className="p-4 bg-gray-100 shadow flex gap-4">
        <Link to="/"            className="font-semibold">Home</Link>
        <Link to="/properties"  className="font-semibold">Properties</Link>
      </nav>

      {/* ───── Route switch ───── */}
      <main className="flex-1">
        <Routes>
          {/* Landing / marketing page */}
          <Route path="/" element={<p className="p-6">Landing page placeholder</p>} />

          {/* Property CRUD */}
          <Route path="/properties"       element={<PropertyList />} />
          <Route path="/properties/:id"   element={<PropertyDetail />} />

          {/* Fallback */}
          <Route path="*" element={<p className="p-6">404 – Page not found</p>} />
        </Routes>
      </main>
    </Router>
  );
}

