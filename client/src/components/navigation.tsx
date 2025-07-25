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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'helper'] },
  { href: '/rooms', label: 'Rooms', icon: Bed, roles: ['admin', 'manager'] },
  { href: '/bookings', label: 'Bookings', icon: Calendar, roles: ['admin', 'manager'] },
  { href: '/cleaning', label: 'Cleaning', icon: Fan, roles: ['admin', 'manager', 'helper'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  { href: '/inquiries', label: 'Inquiries', icon: MessageSquare, roles: ['admin', 'manager'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <nav className="bg-primary-500 text-white shadow-material-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-medium" data-testid="nav-title">
              Honolulu Private Residency Club
            </h1>
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
          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </nav>
  );
}