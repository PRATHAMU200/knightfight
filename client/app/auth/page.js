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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <div className="text-3xl">♛</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
            {isLogin ? "Welcome Back" : "Join Chess Arena"}
          </h1>
          <p className="text-gray-400 text-lg">
            {isLogin
              ? "Sign in to continue your chess journey"
              : "Create your account and start playing"}
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-5">
          {!isLogin && (
            <>
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700 border ${
                      errors.name ? "border-red-500" : "border-gray-600"
                    } rounded-lg py-3 px-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-2">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700 border ${
                      errors.email ? "border-red-500" : "border-gray-600"
                    } rounded-lg py-3 px-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2">{errors.email}</p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserCheck
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700 border ${
                      errors.username ? "border-red-500" : "border-gray-600"
                    } rounded-lg py-3 px-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm mt-2">{errors.username}</p>
                )}
              </div>
            </>
          )}

          {isLogin && (
            /* Email or Username Field for Login */
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="emailOrUsername"
                  placeholder="Enter email or username"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-700 border ${
                    errors.emailOrUsername
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg py-3 px-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.emailOrUsername}
                </p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full bg-gray-700 border ${
                  errors.password ? "border-red-500" : "border-gray-600"
                } rounded-lg py-3 px-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-2">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
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
          <p className="text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={switchMode}
              className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
