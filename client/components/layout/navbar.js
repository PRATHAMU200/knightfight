"use client";

import { useState, useRef, useEffect } from "react";
import { Swords, Menu } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = ["Play", "Learn", "Watch", "Community", "Tools"];

  return (
    <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3  text-white shadow-md">
      {/* Left Section */}
      <Link href={"/"} className="flex items-center space-x-3">
        <Swords className="text-primary h-8 w-8" color="#20b155" />
        <span className="font-bold text-xl select-none bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          KnightFight
        </span>
      </Link>

      {/* Center Section: Navigation Tabs */}
      <div className="hidden sm:flex space-x-8 font-semibold text-gray-300">
        {navItems.map((item) => (
          <button
            key={item}
            className="hover:text-white transition-colors"
            type="button"
          >
            <Link
              key={item}
              href={item === "Learn" || item === "Tools" ? "/playground" : "/"}
              className="hover:text-white transition-colors"
            >
              {item}
            </Link>
          </button>
        ))}
      </div>

      {/* Right Section: Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-full px-3 py-1 focus:outline-none"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {/* Avatar Circle with letter G */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 font-bold text-white select-none">
            G
          </div>
          <span className="text-sm">Guest</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-2 z-20 text-gray-200">
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
              Login
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
              Sign Up
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
              <Link href="/profile">Profile</Link>
            </button>
            {/* <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
              Logout
            </button> */}
          </div>
        )}
      </div>
    </nav>
  );
}
