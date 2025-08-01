// src/components/PropertyList.jsx
import React, { useEffect, useState } from "react";
import { DataStore } from "aws-amplify";
import { Property } from "../models";
import { Link, useNavigate } from "react-router-dom";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  // ────────────────────────── Helpers
  const fetchProps = async () => {
    const all = await DataStore.query(Property);
    setProperties(all);
  };

  const handleDelete = async (prop) => {
    if (
      window.confirm(
        `Delete “${prop.name}”? This will remove it for all your devices.`
      )
    ) {
      await DataStore.delete(prop);
    }
  };

  const handleEdit = (prop) => {
    // Assuming you’ll have /properties/:id/edit wired up
    navigate(`/properties/${prop.id}/edit`);
  };

  // ────────────────────────── Mount & real-time updates
  useEffect(() => {
    fetchProps(); // initial load

    const sub = DataStore.observe(Property).subscribe(() => fetchProps());
    return () => sub.unsubscribe();
  }, []);

  // ────────────────────────── UI
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Properties</h1>

        {/* “Add Property” FAB/link */}
        <Link to="/properties/new" className="btn">
          Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p>No properties yet.</p>
      ) : (
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Address</th>
              <th className="py-2 px-3">Sleeps</th>
              <th className="py-2 px-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2 px-3">
                  {/* Click name to open nested Units view */}
                  <Link
                    className="text-blue-600 underline"
                    to={`/properties/${p.id}`}
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="py-2 px-3">{p.address}</td>
                <td className="py-2 px-3">{p.sleeps}</td>
                <td className="py-2 px-3">
                  <button
                    className="mr-2 text-sm text-blue-500 underline"
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-sm text-red-500 underline"
                    onClick={() => handleDelete(p)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

