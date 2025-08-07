import React from 'react';

interface UnitFormProps {
  unitName: string;
  setUnitName: (name: string) => void;
  sleeps: number;
  setSleeps: (value: number) => void;
  unitPrice: number;
  setUnitPrice: (value: number) => void;
  handleAddOrUpdateUnit: () => void;
}

export default function UnitForm({
  unitName,
  setUnitName,
  sleeps,
  setSleeps,
  unitPrice,
  setUnitPrice,
  handleAddOrUpdateUnit
}: UnitFormProps) {
  return (
    <div className="border p-4 rounded mb-8">
      <h2 className="text-xl font-semibold mb-4">Add New Unit</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Unit Name</label>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sleeps</label>
          <input
            type="number"
            value={sleeps}
            onChange={(e) => setSleeps(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 w-24"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price ($)</label>
          <input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 w-24"
            min={0}
          />
        </div>
        <button
          onClick={handleAddOrUpdateUnit}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Unit
        </button>
      </div>
    </div>
  );
}
