"use client";

import { Swords } from "lucide-react";
import Link from "next/link";
export default function Footer() {
  return (
    <footer className="bg-black bg-opacity-70 backdrop-blur-md text-gray-300 px-8 py-10 select-none mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10">
        {/* Left side: Logo + Name + Tagline */}
        <div className="flex flex-col space-y-3 md:max-w-xs">
          <div className="flex items-center space-x-3 cursor-pointer">
            <Swords className="text-primary h-10 w-10" color="#20b155" />
            <span className="text-green-500 font-extrabold text-2xl tracking-wide bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              KnightFight
            </span>
          </div>
          <p className="text-gray-400 mt-2 max-w-xs">
            Where strategy meets the thrill — Your ultimate chess battle arena.
          </p>
        </div>

        {/* Right side: Navigation lists */}
        <div className="flex justify-between flex-grow max-w-4xl gap-10">
          {/* Play */}
          <div>
            <h3 className="font-semibold text-green-500 mb-2">Play</h3>
            <ul className="space-y-1 text-gray-400 text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                New Game
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Tournaments
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Computer
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="font-semibold text-green-500 mb-2">Learn</h3>
            <ul className="space-y-1 text-gray-400 text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Tutorial
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Puzzles
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Analysis
              </li>
            </ul>
          </div>

          {/* Community */}
          {/* <div>
            <h3 className="font-semibold text-green-500 mb-2">Community</h3>
            <ul className="space-y-1 text-gray-400 text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Forums
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Players
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Clubs
              </li>
            </ul>
          </div> */}

          {/* More */}
          <div>
            <h3 className="font-semibold text-green-500 mb-2">More</h3>
            <ul className="space-y-1 text-gray-400 text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                About
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Help
              </li>
              <li className="hover:text-green-400 cursor-pointer transition-colors">
                Privacy
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-10 border-t border-green-700 pt-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm select-none">
        {/* Left copyright */}
        <div>© 2025 KnightFight by Prathamu200. All rights reserved.</div>

        {/* Right social icons */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          {[
            {
              href: "https://twitter.com/mercykknight",
              label: "Twitter",
              svg: (
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              ),
            },
            {
              href: "https://facebook.com/mercykknight",
              label: "Facebook",
              svg: (
                <path d="M22 12a10 10 0 10-11.62 9.87v-6.99H8.07v-2.88h2.31V9.42c0-2.28 1.37-3.55 3.47-3.55.99 0 2.02.18 2.02.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.42v1.7h2.5l-.4 2.88h-2.1v6.99A10 10 0 0022 12z" />
              ),
            },
            {
              href: "https://instagram.com/mercykknight",
              label: "Instagram",
              svg: (
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zM12 7a5 5 0 100 10 5 5 0 000-10zm5.5-.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              ),
            },
            {
              href: "https://linkedin.com/u/prathamu200",
              label: "LinkedIn",
              svg: (
                <path d="M19 3A2 2 0 0121 5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-9 14v-6H7v6h3zm-1.5-7a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM17 17v-3a2 2 0 00-4 0v3h3z" />
              ),
            },
          ].map(({ href, label, svg }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="hover:text-green-500 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {svg}
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
