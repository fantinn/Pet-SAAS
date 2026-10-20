import { useRef, useState } from "react";

export default function Button({ children, onClick, variant = "primary", className = "", disabled = false, title, type = "button", ...props }) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  async function click(event) {
    if (lock.current || !onClick) return;
    lock.current = true;
    setPending(true);
    try { await onClick(event); }
    finally { lock.current = false; setPending(false); }
  }
  const baseStyles = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2 rounded text-sm font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300",
    warning: "bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:bg-gray-100",
  };

  return (
    <button
      {...props}
      type={type}
      onClick={click}
      disabled={disabled || pending}
      aria-busy={pending}
      title={title}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
