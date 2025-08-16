// src/pages/PropertyDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Property, Unit } from "../models";
import UnitList from "../components/UnitList";
import UnitForm from "../components/UnitForm";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  // Fetch both property & units
  const fetchData = async () => {
    const prop = await DataStore.query(Property, id);
    setProperty(prop);
    const u = await DataStore.query(Unit, (q) => q.propertyID("eq", id));
    setUnits(u);
  };

  // Reload units only (for after create/edit)
  const reloadUnits = async () => {
    const u = await DataStore.query(Unit, (q) => q.propertyID("eq", id));
    setUnits(u);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes so UI stays in sync
    const subP = DataStore.observe(Property, id).subscribe(fetchData);
    const subU = DataStore.observe(Unit).subscribe(fetchData);
    return () => {
      subP.unsubscribe();
      subU.unsubscribe();
    };
  }, [id]);

  if (!property) {
    return <p className="p-6">Loading property…</p>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <p className="text-sm text-gray-600">{property.address}</p>
        </div>
        <Link to="/properties" className="text-blue-500 underline">
          ← Back to Properties
        </Link>
      </div>

      <p className="mb-6">
        <strong>Total Sleeps:</strong>{" "}
        {units.reduce((sum, u) => sum + (u.sleeps || 0), 0)}
      </p>

      {/* Add Unit Button */}
      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUnit(null);
            setShowForm(true);
          }}
        >
          + Add Unit
        </button>
      </div>

      {/* Unit Form (add/edit) */}
      {showForm && (
        <div className="mb-6 border p-4 rounded bg-gray-50">
          <UnitForm
            unit={editingUnit}
            propertyID={property.id}
            onSuccess={() => {
              setShowForm(false);
              reloadUnits();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Units List */}
      <UnitList
        units={units}
        onEdit={(unit) => {
          setEditingUnit(unit);
          setShowForm(true);
        }}
      />
    </div>
);
}

