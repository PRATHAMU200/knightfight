// components/Toast.js
import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

const Toast = ({ message, type = "success", duration = 100, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 1000); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div
        className={`flex items-center px-4 py-3 rounded-lg shadow-lg border max-w-md ${
          type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : type === "error"
            ? "bg-red-50 border-red-200 text-red-800"
            : type === "warning"
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}
      >
        <div className="flex-shrink-0">
          {type === "success" && <Check className="w-5 h-5 text-green-500" />}
          {type === "error" && <X className="w-5 h-5 text-red-500" />}
          {type === "warning" && (
            <span className="w-5 h-5 text-yellow-500">⚠</span>
          )}
          {type === "info" && <span className="w-5 h-5 text-blue-500">ℹ</span>}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {/* <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button> */}
      </div>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success", duration = 1000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};

export default Toast;
