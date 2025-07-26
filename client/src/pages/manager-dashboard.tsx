
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardStatCard from '@/components/dashboard-stat-card';
import ManagerListingsTable from '@/components/manager-listings-table';
import TaskList from '@/components/task-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Users, 
  DollarSign, 
  ClipboardList,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

export default function ManagerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['manager-stats', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/manager/stats/${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (statsLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your property management overview...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Building className="h-8 w-8" />
          Manager Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}. Here's your property management overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatCard
          title="Available Rooms"
          value={stats?.availableRooms || 0}
          subtitle="Ready for booking"
          icon={Building}
          trend={stats?.weeklyGrowth ? {
            value: stats.weeklyGrowth,
            label: "from last week",
            isPositive: stats.weeklyGrowth >= 0
          } : undefined}
        />
        
        <DashboardStatCard
          title="Active Bookings"
          value={stats?.activeBookings || 0}
          subtitle="Current guests"
          icon={Users}
          badge={{
            text: "Live",
            variant: "default"
          }}
        />
        
        <DashboardStatCard
          title="Today's Revenue"
          value={`$${stats?.todayRevenue || 0}`}
          subtitle="Collected today"
          icon={DollarSign}
          trend={stats?.weeklyGrowth ? {
            value: Math.abs(stats.weeklyGrowth * 0.5),
            label: "vs yesterday",
            isPositive: stats.weeklyGrowth >= 0
          } : undefined}
        />
        
        <DashboardStatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          subtitle="Require attention"
          icon={ClipboardList}
          badge={stats?.pendingTasks > 5 ? {
            text: "High",
            variant: "destructive"
          } : undefined}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="properties" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">My Properties</TabsTrigger>
          <TabsTrigger value="tasks">Tasks & Maintenance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-6">
          <ManagerListingsTable />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Property Tasks & Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList showOnlyAssigned={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Weekly Revenue</span>
                    <span className="font-medium">${stats?.weeklyRevenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Revenue</span>
                    <span className="font-medium">${stats?.monthlyRevenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className={`font-medium ${
                      (stats?.weeklyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.weeklyGrowth >= 0 ? '+' : ''}{stats?.weeklyGrowth || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Payment</span>
                    <span className="font-medium">
                      {stats?.lastPaymentTime ? 
                        new Date(stats.lastPaymentTime).toLocaleDateString() : 
                        'No recent payments'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-medium text-orange-600">
                      {stats?.pendingPaymentsCount || 0} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Overdue Payments</span>
                    <span className="font-medium text-red-600">
                      {stats?.overduePaymentsCount || 0} items
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

