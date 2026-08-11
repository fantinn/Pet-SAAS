export default function StatusBadge({ status, colors }) {
  const colorClass = colors[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}