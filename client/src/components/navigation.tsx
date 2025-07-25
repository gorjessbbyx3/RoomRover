import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Bed, 
  Calendar, 
  Fan, 
  CreditCard, 
  FileText, 
  LogOut,
  Users,
  MessageSquare,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'helper'] },
  { href: '/rooms', label: 'Rooms', icon: Bed, roles: ['admin', 'manager'] },
  { href: '/bookings', label: 'Bookings', icon: Calendar, roles: ['admin', 'manager'] },
  { href: '/cleaning', label: 'Cleaning', icon: Fan, roles: ['admin', 'manager', 'helper'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { href: '/inquiries', label: 'Inquiries', icon: MessageSquare, roles: ['admin', 'manager'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-primary-500 text-white shadow-material-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-medium truncate mr-4" data-testid="nav-title">
              Honolulu Private Residency Club
            </h1>
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-8">
              <div className="flex space-x-4">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <span 
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors cursor-pointer",
                          isActive 
                            ? "bg-primary-600 text-white" 
                            : "text-primary-100 hover:bg-primary-600 hover:text-white"
                        )}
                        data-testid={`nav-link-${item.href.substring(1)}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm" data-testid="user-name">{user.name}</span>
              <span 
                className="px-2 py-1 bg-primary-600 text-xs rounded-full" 
                data-testid="user-role"
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.property && (
                <span 
                  className="px-2 py-1 bg-primary-700 text-xs rounded-full"
                  data-testid="user-property"
                >
                  {user.property}
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-white hover:bg-primary-600"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-primary-600 bg-primary-700 border border-primary-300 p-2"
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeMobileMenu}
            />
            {/* Menu */}
            <div className="md:hidden absolute top-16 left-0 right-0 bg-primary-500 border-t border-primary-600 shadow-lg z-50">
              <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;

                return (
                  <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                    <span 
                      className={cn(
                        "block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3 transition-colors cursor-pointer",
                        isActive 
                          ? "bg-primary-600 text-white" 
                          : "text-primary-100 hover:bg-primary-600 hover:text-white"
                      )}
                      data-testid={`mobile-nav-link-${item.href.substring(1)}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
              
              {/* Mobile User Info */}
              <div className="border-t border-primary-600 pt-4 mt-4">
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-medium" data-testid="mobile-user-name">{user.name}</span>
                    <span 
                      className="px-2 py-1 bg-primary-600 text-xs rounded-full" 
                      data-testid="mobile-user-role"
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  {user.property && (
                    <div className="mb-3">
                      <span 
                        className="px-2 py-1 bg-primary-700 text-xs rounded-full"
                        data-testid="mobile-user-property"
                      >
                        {user.property}
                      </span>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="text-white hover:bg-primary-600 w-full justify-start"
                    data-testid="mobile-button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}