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
  Package,
  Wrench,
  Shield,
  Key
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'helper'] },
  { href: '/inhouse', label: 'InHouse', icon: Bed, roles: ['admin', 'manager'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { href: '/inquiries', label: 'Inquiries', icon: MessageSquare, roles: ['admin', 'manager'] },
  { href: '/user-management', label: 'User Management', icon: Users, roles: ['admin'] },

  { href: '/banned-users-management', label: 'Banned Users', icon: Shield, roles: ['admin'] },
  { href: '/operations', label: 'Operations', icon: Package, roles: ['admin', 'manager', 'helper'] },
];

function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <Sidebar>
      <SidebarHeader className="bg-primary-500 text-white p-4">
        <h1 className="text-lg font-medium" data-testid="nav-title">
          Honolulu Members-Only ClubHouse
        </h1>
        <div className="mt-2 space-y-1">
          <div className="text-sm" data-testid="user-name">{user.name}</div>
          <div className="flex items-center gap-2">
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
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary-500">
        <SidebarMenu>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive}
                  className="text-white hover:bg-primary-600 data-[active=true]:bg-primary-600"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-primary-500 p-4">
        <Button 
          variant="ghost" 
          onClick={logout}
          className="text-white hover:bg-primary-600 justify-start w-full"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="text-primary-500" />
      <div className="flex-1" />
    </header>
  );
}

export default function Navigation({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}