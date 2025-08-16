import Link from 'next/link';
import type { Unit } from '@/types/Property';

interface UnitListProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (unitId: string) => void;
}

export default function UnitList({ units, onEdit, onDelete }: UnitListProps) {
  if (!units || units.length === 0) {
    return <p className="text-gray-500">No units found for this property.</p>;
  }

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Units</h2>
      <ul className="space-y-2">
        {units.map((unit) => (
          <li key={unit.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
            <div>
              <Link href={`/units/${unit.id}`} className="font-semibold text-blue-600 hover:underline">
                {unit.name}
              </Link>
              <span className="ml-2 text-gray-700">— Sleeps {unit.sleeps}</span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => onEdit(unit)}
                className="text-blue-500 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(unit.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
