export default function Button({ children, onClick, variant = "primary", className = "", disabled = false }) {
  const baseStyles = "px-4 py-2 rounded text-sm font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}