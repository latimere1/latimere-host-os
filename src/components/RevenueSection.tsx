// src/components/RevenueSection.tsx

import React from 'react'
import type { Property } from '@/types/Property'
import type { RevenueRecord } from '@/types/RevenueRecord'

interface Props {
  property: Property
  revenueMonth: string
  setRevenueMonth: (month: string) => void
  revenueUnitId: string
  setRevenueUnitId: (unitId: string) => void
  revenueAmount: string
  setRevenueAmount: (amount: string) => void
  handleAddRevenue: () => Promise<void>
  revenueRecords: RevenueRecord[]
  getProjectedTotal: () => number
  getActualTotal: () => number
}

export default function RevenueSection({
  property,
  revenueMonth,
  setRevenueMonth,
  revenueUnitId,
  setRevenueUnitId,
  revenueAmount,
  setRevenueAmount,
  handleAddRevenue,
  revenueRecords,
  getProjectedTotal,
  getActualTotal,
}: Props) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">Revenue Tracking</h2>

      {/* Input Form */}
      <div className="border rounded p-4 mb-6 bg-white">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="sr-only" htmlFor="unit-select">Unit</label>
          <select
            id="unit-select"
            value={revenueUnitId}
            onChange={(e) => setRevenueUnitId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select unit</option>
            {property.units.items.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="month-input">Month</label>
          <input
            id="month-input"
            type="month"
            value={revenueMonth}
            onChange={(e) => setRevenueMonth(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <label className="sr-only" htmlFor="amount-input">Amount</label>
          <input
            id="amount-input"
            type="number"
            min={0}
            placeholder="Amount ($)"
            value={revenueAmount}
            onChange={(e) => setRevenueAmount(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />

          <button
            type="button"
            onClick={handleAddRevenue}
            className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
          >
            Add Revenue
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded p-4 shadow">
          <p className="text-gray-600">Projected Revenue</p>
          <p className="text-xl font-bold">${getProjectedTotal().toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded p-4 shadow">
          <p className="text-gray-600">Actual Revenue</p>
          <p className="text-xl font-bold">${getActualTotal().toFixed(2)}</p>
        </div>
      </div>

      {/* Records List */}
      {revenueRecords.length > 0 ? (
        <ul className="divide-y border rounded bg-white">
          {revenueRecords.map((r) => {
            const unit = property.units.items.find((u) => u.id === r.unitID)
            return (
              <li key={r.id} className="flex justify-between px-4 py-2">
                <span className="font-medium">{unit?.name ?? 'Unknown Unit'}</span>
                <span className="text-gray-700">
                  ${r.amount.toFixed(2)} <span className="text-sm text-gray-500">({r.month})</span>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-gray-500">No revenue records for this period.</p>
      )}
    </section>
  )
}
