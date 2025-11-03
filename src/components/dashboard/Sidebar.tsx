"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Share2,
  Clock3,
  Star,
  Archive,
  Menu,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "personal",
      label: "Personal",
      icon: <BookOpen className="w-5 h-5" />,
    },
    { id: "shared", label: "Shared", icon: <Share2 className="w-5 h-5" /> },
    { id: "recent", label: "Recent", icon: <Clock3 className="w-5 h-5" /> },
    { id: "favorites", label: "Favorites", icon: <Star className="w-5 h-5" /> },
    { id: "archive", label: "Archive", icon: <Archive className="w-5 h-5" /> },
  ];

  return (
    <div
      className={`sticky top-0 h-screen flex flex-col text-gray-800 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h1 className="text-xl font-bold">inki</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="neu-separator" />
      </div>

      <nav className="p-4 space-y-3">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center gap-0" : "gap-3"
            } p-3 rounded-lg glass-hover-subtle ${
              currentView === item.id ? "text-gray-900" : "text-gray-700"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-4">
        <div className="neu-separator" />
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="px-4">
          <div className="neu-separator" />
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center neu-outset">
            <span className="text-sm font-medium">JD</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
