export default function Input({ label, value, onChange, type = "text", placeholder = "", className = "" }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}