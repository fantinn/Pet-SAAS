const VARIANTES = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  secondary: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 focus-visible:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-gray-400",
};

const TAMANHOS = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  title,
  "aria-label": ariaLabel,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${TAMANHOS[size]} ${VARIANTES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
