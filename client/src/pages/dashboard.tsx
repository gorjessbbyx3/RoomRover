import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import PropertyOverview from '@/components/property-overview';
import StatusBadge from '@/components/status-badge';
import { DashboardStats, RoomWithDetails, CleaningTaskWithDetails, PropertyWithRooms } from '@/lib/types';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Users, 
  Calendar, 
  DollarSign,
  Home,
  Bed,
  Wrench,
  ClipboardList,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Bell,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  MessageSquare,
  Package,
  Fan,
  HandCoins,
  Key
} from 'lucide-react';
import FrontDoorManager from '@/components/front-door-manager';
import AddTaskDialog from '@/components/add-task-dialog';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<RoomWithDetails[]>({
    queryKey: ['/api/rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json();
    }
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyWithRooms[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  const { data: cleaningTasks, isLoading: tasksLoading } = useQuery<CleaningTaskWithDetails[]>({
    queryKey: ['/api/cleaning-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/cleaning-tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch cleaning tasks');
      return response.json();
    }
  });

  if (!user) return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`;

  const pendingTasks = cleaningTasks?.filter(task => task.status === 'pending') || [];
  const highPriorityTasks = pendingTasks.filter(task => ['high', 'critical'].includes(task.priority));

  // Group rooms by property
  const propertiesWithRooms: PropertyWithRooms[] = properties?.map(property => ({
    ...property,
    rooms: rooms?.filter(room => room.propertyId === property.id) || []
  })) || [];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user.name}. Here's your property overview.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <Bed className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available Rooms</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-available-rooms">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.availableRooms || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Memberships</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-active-bookings">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.activeBookings || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <Fan className="h-4 w-4 text-warning-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-pending-tasks">
                    {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.pendingTasks || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue Today</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-revenue-today">
                    {statsLoading ? <Skeleton className="h-6 w-12" /> : formatCurrency(stats?.todayRevenue || 0)}
                  </dd>
                  <dd className="text-xs text-success-600 mt-1">
                    {stats?.paymentMethodBreakdown ? (
                      `Cash: ${formatCurrency(stats.paymentMethodBreakdown.cash || 0)} | CashApp: ${formatCurrency(stats.paymentMethodBreakdown.cashApp || 0)}`
                    ) : ''}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Overview */}
      {(user.role === 'admin' || user.role === 'manager') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {propertiesLoading ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </>
          ) : (
            propertiesWithRooms
              .filter(property => user.role === 'admin' || user.property === property.id)
              .map((property) => (
                <PropertyOverview 
                  key={property.id} 
                  property={property}
                  onRoomClick={(roomId) => console.log('Room clicked:', roomId)}
                />
              ))
          )}
        </div>
      )}

      {/* Recent Activities & Cleaning Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleaning Tasks */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                Pending Cleaning Tasks
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {highPriorityTasks.length} high priority tasks
              </p>
            </div>
            {(user.role === 'admin' || user.role === 'manager') && (
              <Button size="sm" className="bg-primary-500 hover:bg-primary-600" data-testid="button-add-task">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {tasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-4">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className={`border rounded-lg p-4 ${
                      task.priority === 'critical' ? 'bg-error-50 border-error-200' :
                      task.priority === 'high' ? 'bg-warning-50 border-warning-200' :
                      'border-gray-200'
                    }`}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {task.dueDate 
                              ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                              : 'No due date'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <StatusBadge status={task.priority} type="priority" />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-success-600 hover:text-success-800"
                          data-testid={`button-complete-task-${task.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Fan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending cleaning tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Payment Alerts & System Status */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900">
              Payment Alerts & System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Payment Alerts */}
              {statsLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <>
                  {(stats?.overduePaymentsCount || 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-error-50 border border-error-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-error-500 mr-3" />
                        <div>
                          <div className="font-medium text-error-800">
                            {stats?.overduePaymentsCount} Overdue Payment{(stats?.overduePaymentsCount || 0) > 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-error-600">
                            Total: {formatCurrency(stats?.overduePaymentsAmount || 0)}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-error-300 text-error-700">
                        Review
                      </Button>
                    </div>
                  )}
                  {(stats?.pendingPaymentsCount || 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-warning-500 mr-3" />
                        <div>
                          <div className="font-medium text-warning-800">
                            {stats?.pendingPaymentsCount} Pending Payment{(stats?.pendingPaymentsCount || 0) > 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-warning-600">
                            Total: {formatCurrency(stats?.pendingPaymentsAmount || 0)}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-warning-300 text-warning-700">
                        Process
                      </Button>
                    </div>
                  )}
                  {(stats?.overduePaymentsCount || 0) === 0 && (stats?.pendingPaymentsCount || 0) === 0 && (
                    <div className="flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success-500 mr-3" />
                        <span className="font-medium text-success-800">All Payments Up to Date</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* System Status */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment System</span>
                    <span className="text-success-600 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash App Integration</span>
                    <span className="text-success-600 font-medium">$selarazmami</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Payment</span>
                    <span className="text-gray-600">
                      {stats?.lastPaymentTime ? new Date(stats.lastPaymentTime).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              {(user.role === 'admin') && (
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-view-reports">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Payment Reports
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Payment Recording */}
      {(user.role === 'admin' || user.role === 'manager') && (
        <div className="mt-8 mb-8">
          <Card className="shadow-material bg-gradient-to-r from-success-50 to-primary-50 border-success-200">
            <CardHeader className="border-b border-success-200">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-success-600" />
                Quick Payment Actions
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Fast access to common payment tasks
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/bookings'}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">New Booking</p>
                        <p className="text-lg font-semibold text-blue-600">Create</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/payments'}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Record Payment</p>
                        <p className="text-lg font-semibold text-green-600">Payment</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/cleaning'}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">View Tasks</p>
                        <p className="text-lg font-semibold text-purple-600">Cleaning</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="p-6">
                  <AddTaskDialog 
                    trigger={
                      <div className="flex items-center justify-between cursor-pointer w-full">
                        <div>
                          <p className="text-sm text-gray-600">Quick Task</p>
                          <p className="text-lg font-semibold text-orange-600">Create</p>
                        </div>
                        <Package className="h-8 w-8 text-orange-600" />
                      </div>
                    }
                  />
                </Card>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <span className="mr-2">💡 Tip:</span>
                  <span>Cash App payments go to <strong className="text-purple-600">$selarazmami</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manager Cash Drawer Monitoring - Admin Only */}
      {user.role === 'admin' && (
        <div className="mt-8 mb-8">
          <Card className="shadow-material bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200">
            <CardHeader className="border-b border-yellow-200">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                <HandCoins className="h-5 w-5 mr-2 text-yellow-600" />
                Manager Cash Drawer Monitoring
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Real-time tracking of manager cash holdings and turn-ins
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : stats?.cashDrawerStats && stats.cashDrawerStats.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-600">Active Managers</div>
                          <div className="text-xl font-bold text-blue-600">
                            {stats.cashDrawerStats.length}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-600">Total Cash Holdings</div>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(stats.cashDrawerStats.reduce((sum, stat) => sum + stat.currentCashHolding, 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-600">Today's Collections</div>
                          <div className="text-xl font-bold text-purple-600">
                            {formatCurrency(stats.cashDrawerStats.reduce((sum, stat) => sum + stat.totalCashCollectedToday, 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Manager Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.cashDrawerStats.map((drawerStat) => (
                      <div key={drawerStat.managerId} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{drawerStat.managerName}</h4>
                            <p className="text-sm text-gray-600">{drawerStat.property}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            drawerStat.currentCashHolding > 200 
                              ? 'bg-warning-100 text-warning-800' 
                              : 'bg-success-100 text-success-800'
                          }`}>
                            {drawerStat.currentCashHolding > 200 ? 'High' : 'Normal'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Current Holding:</span>
                            <span className={`font-medium ${
                              drawerStat.currentCashHolding > 200 ? 'text-warning-600' : 'text-gray-900'
                            }`}>
                              {formatCurrency(drawerStat.currentCashHolding)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Today's Collection:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(drawerStat.totalCashCollectedToday)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Last Turn-in:</span>
                            <span className="text-sm text-gray-900">
                              {drawerStat.lastTurnInDate 
                                ? `${formatCurrency(drawerStat.lastTurnInAmount || 0)} on ${new Date(drawerStat.lastTurnInDate).toLocaleDateString()}`
                                : 'No turn-ins yet'
                              }
                            </span>
                          </div>
                        </div>

                        {drawerStat.currentCashHolding > 200 && (
                          <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-warning-500 mr-2" />
                              <span className="text-xs text-warning-700">
                                Consider requesting cash turn-in
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HandCoins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active managers with cash holdings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Front Door Code Management */}
      <div className="mt-8">
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Front Door Code Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {propertiesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <FrontDoorManager properties={properties || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}