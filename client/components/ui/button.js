import React from "react";

export default function Button({
  children,
  onClick,
  className = "",
  ...props
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 transition duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
