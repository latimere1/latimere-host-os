// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
import PropertyList from "./components/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";

Amplify.configure(awsExports);

// Wrapper to block access until user is signed in
function RequireAuth({ children }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  if (authStatus !== 'authenticated') return null;
  return children;
}

export default function App() {
  return (
    <Authenticator>
      <RequireAuth>
        <Router>
          {/* ───── Top navigation ───── */}
          <nav className="p-4 bg-gray-100 shadow flex gap-4">
            <Link to="/" className="font-semibold">Home</Link>
            <Link to="/properties" className="font-semibold">Properties</Link>
          </nav>

          {/* ───── Route switch ───── */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<p className="p-6">Landing page placeholder</p>} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="*" element={<p className="p-6">404 – Page not found</p>} />
            </Routes>
          </main>
        </Router>
      </RequireAuth>
    </Authenticator>
  );
}
