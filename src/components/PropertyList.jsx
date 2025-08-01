// src/components/PropertyList.jsx
import React, { useEffect, useState } from "react";
import { DataStore } from "aws-amplify";
import { Property } from "../models";
import { Link } from "react-router-dom";
import PropertyForm from "./PropertyForm";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProp, setEditingProp] = useState(null);

  const fetchProps = async () => {
    try {
      const all = await DataStore.query(Property);
      console.log("Fetched properties:", all);

      // Sanitize in case of bad data
      const filtered = all.filter(
        (p) => p && typeof p.name === "string" && typeof p.address === "string"
      );
      setProperties(filtered);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    }
  };

  const handleDelete = async (prop) => {
    if (
      window.confirm(
        `Delete “${prop.name}”? This will remove it for all your devices.`
      )
    ) {
      try {
        await DataStore.delete(prop);
      } catch (err) {
        console.error("Failed to delete property:", err);
        alert("Could not delete property.");
      }
    }
  };

  useEffect(() => {
    fetchProps(); // Initial load

    const sub = DataStore.observe(Property).subscribe(() => {
      fetchProps();
    });

    return () => sub.unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Properties</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingProp(null);
            setShowForm(true);
          }}
        >
          + Add Property
        </button>
      </div>

      {/* Property Form */}
      {showForm && (
        <div className="mb-6 border p-4 rounded bg-gray-50">
          <PropertyForm
            property={editingProp}
            onSuccess={() => {
              setShowForm(false);
              fetchProps();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {properties.length === 0 ? (
        <p>No properties yet.</p>
      ) : (
        <table className="min-w-full text-left border">
          <thead>
            <tr>
              <th className="py-2 px-3 border-b">Name</th>
              <th className="py-2 px-3 border-b">Address</th>
              <th className="py-2 px-3 border-b">Sleeps</th>
              <th className="py-2 px-3 border-b w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2 px-3">
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
                    onClick={() => {
                      setEditingProp(p);
                      setShowForm(true);
                    }}
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
