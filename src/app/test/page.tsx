export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Tailwind CSS Test Page</h1>
      <div className="bg-blue-500 p-4 rounded-lg mb-4">
        <p className="text-white">If you can see colors and styling, Tailwind is working.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500 p-4 rounded">Green</div>
        <div className="bg-yellow-500 p-4 rounded">Yellow</div>
        <div className="bg-purple-500 p-4 rounded">Purple</div>
      </div>
      <button className="mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200">
        Test Button
      </button>
    </div>
  );
}