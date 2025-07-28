import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../lib/auth";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    if (logout && typeof logout === 'function') {
      logout();
    }
    setLocation('/login');
    setIsOpen(false);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", roles: ["manager", "helper", "guest"] },
    { path: "/rooms", label: "Rooms", roles: ["manager", "helper", "guest"] },
    { path: "/bookings", label: "Bookings", roles: ["manager", "helper"] },
    { path: "/operations-dashboard", label: "Operations", roles: ["manager"] },
    { path: "/cleaning", label: "Cleaning", roles: ["manager", "helper"] },
    { path: "/payments", label: "Payments", roles: ["manager"] },
    { path: "/inquiries", label: "Inquiries", roles: ["manager", "helper"] },
    { path: "/profile", label: "Profile", roles: ["manager", "helper", "guest"] },
  ];

  const visibleItems = navItems.filter(item => 
    item.roles.includes(user?.role || "guest")
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">RoomRover</h1>
            </div>
            <div className="hidden md:flex space-x-4">
              {visibleItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
                <span className="text-sm text-gray-700">{user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}