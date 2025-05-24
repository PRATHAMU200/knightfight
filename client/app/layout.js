import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "KnightFight",
  description:
    "Learning Chess like never before. Play with computer, or create and share the chess match with anyone. Also spectator mode to play and stream option for chess game.",
};

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="en">
        <body className="max-w-7xl mx-auto">
          <Navbar />
          {children}
          <Footer />
        </body>
      </html>
    </>
  );
}
