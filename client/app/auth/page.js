"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    emailOrUsername: "",
    password: "",
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      // Register validation
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }

      if (!formData.username) {
        newErrors.username = "Username is required";
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        newErrors.username =
          "Username must be 3-20 characters (letters, numbers, underscore only)";
      }
    } else {
      // Login validation
      if (!formData.emailOrUsername) {
        newErrors.emailOrUsername = "Email or username is required";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isLogin && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const url = `${serveruri}/api/auth/${isLogin ? "login" : "register"}`;
      const payload = isLogin
        ? {
            emailOrUsername: formData.emailOrUsername,
            password: formData.password,
          }
        : {
            name: formData.name,
            email: formData.email,
            username: formData.username,
            password: formData.password,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem("chess_token", data.token);
        localStorage.setItem("chess_user", JSON.stringify(data.user));

        // Set cookie for additional security
        document.cookie = `chess_auth=${data.token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; secure; samesite=strict`;

        setMessage({
          type: "success",
          text: isLogin ? "Login successful!" : "Registration successful!",
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          username: "",
          emailOrUsername: "",
          password: "",
        });

        // You can redirect here or emit an event to parent component
        window.location.href = "/"; // Example redirect
      } else {
        if (data.field && data.error) {
          setErrors({ [data.field]: data.error });
        } else {
          setMessage({
            type: "error",
            text: data.error || "Something went wrong",
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: "",
      email: "",
      username: "",
      emailOrUsername: "",
      password: "",
    });
    setErrors({});
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
            <div className="text-2xl">♛</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back" : "Join the Game"}
          </h1>
          <p className="text-slate-400">
            {isLogin
              ? "Sign in to your chess account"
              : "Create your chess account"}
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-900/50 border border-green-500 text-green-300"
                : "bg-red-900/50 border border-red-500 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {!isLogin && (
            <>
              {/* Name Field */}
              <div>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${
                      errors.name ? "border-red-500" : "border-slate-600"
                    } rounded-lg py-3 px-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${
                      errors.email ? "border-red-500" : "border-slate-600"
                    } rounded-lg py-3 px-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <div className="relative">
                  <UserCheck
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${
                      errors.username ? "border-red-500" : "border-slate-600"
                    } rounded-lg py-3 px-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            </>
          )}

          {isLogin && (
            /* Email or Username Field for Login */
            <div>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  name="emailOrUsername"
                  placeholder="Email or Username"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  className={`w-full bg-slate-800/50 border ${
                    errors.emailOrUsername
                      ? "border-red-500"
                      : "border-slate-600"
                  } rounded-lg py-3 px-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.emailOrUsername}
                </p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full bg-slate-800/50 border ${
                  errors.password ? "border-red-500" : "border-slate-600"
                } rounded-lg py-3 px-12 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              loading ? "animate-pulse" : ""
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </div>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className="text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={switchMode}
              className="ml-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
