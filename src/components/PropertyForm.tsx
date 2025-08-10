export default function PropertyForm({
  propertyName,
  setPropertyName,
  propertyAddress,
  setPropertyAddress,
  handleUpdateProperty,
  handleDeleteProperty,
}) {
  return (
    <div className="space-y-4 mb-6">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Address</label>
        <input
          type="text"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>
      <div className="flex space-x-4">
        <button
          onClick={handleUpdateProperty}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Property Changes
        </button>
        <button
          onClick={handleDeleteProperty}
          className="text-red-600 underline"
        >
          Delete Property
        </button>
      </div>
    </div>
  );
}
