
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, CalendarIcon, ClipboardIcon, UserIcon, ChartBarIcon } from '@heroicons/react/outline';

const navItems = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Bookings', href: '/bookings', icon: CalendarIcon },
  { label: 'Tasks', href: '/tasks', icon: ClipboardIcon },
  { label: 'Profile', href: '/profile', icon: UserIcon },
  { label: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>(location.pathname);

  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-lg flex md:hidden z-40"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = active === item.href;
        return (
          <button
            key={item.href}
            aria-label={item.label}
            className={
              `flex-1 flex flex-col items-center justify-center py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ` +
              (isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800')
            }
            tabIndex={0}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              setActive(item.href);
              navigate(item.href);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActive(item.href);
                navigate(item.href);
              }
            }}
            type="button"
          >
            <Icon className="w-6 h-6 mb-1" aria-hidden="true" />
            <span className="sr-only">{item.label}</span>
            <span aria-hidden="true">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
