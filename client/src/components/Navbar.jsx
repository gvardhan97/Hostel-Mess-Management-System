import React from "react";
import { Menu } from "lucide-react";
import Logo from "./Logo.jsx";
import MyLogo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const HOME_PATH = { student: "/student", manager: "/manager", admin: "/admin" };

export default function Navbar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const homePath = HOME_PATH[user.role] || "/";

  // Avatar initials (first + last name initials if available)
  const initials = user.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "?";

  const AVATAR_COLORS = {
    student: "bg-blue-100 text-blue-700",
    manager: "bg-indigo-100 text-indigo-700",
    admin:   "bg-violet-100 text-violet-700",
  };
  const avatarColor = AVATAR_COLORS[user.role] || "bg-neutral-100 text-neutral-700";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left: Clickable Logo + Title → goes to role's home page */}
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-3 hover:opacity-80 transition rounded-lg px-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go to home"
        >
          <Logo src={MyLogo} size={40} alt="Mess Logo" />
          <h1 className="text-lg font-semibold">IIITA Mess</h1>
        </button>

        {/* Right: Avatar (→ /me) + Hamburger */}
        <div className="flex items-center gap-2">
          {/* User avatar button */}
          {user.name && (
            <button
              onClick={() => navigate("/me")}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition hover:opacity-80 ${avatarColor}`}
              title={`${user.name} — View Profile`}
              aria-label="View profile"
            >
              {initials}
            </button>
          )}

          {/* Hamburger */}
          <button
            className="p-2 rounded-xl hover:bg-neutral-100 transition"
            aria-label="Open menu"
            onClick={onOpenSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
