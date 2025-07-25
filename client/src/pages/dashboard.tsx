import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import PropertyOverview from '@/components/property-overview';
import StatusBadge from '@/components/status-badge';
import { DashboardStats, RoomWithDetails, CleaningTaskWithDetails, PropertyWithRooms } from '@/lib/types';
import { 
  Bed, 
  Calendar, 
  Fan, 
  DollarSign, 
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import FrontDoorManager from '@/components/front-door-manager';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<RoomWithDetails[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyWithRooms[]>({
    queryKey: ['/api/properties'],
  });

  const { data: cleaningTasks, isLoading: tasksLoading } = useQuery<CleaningTaskWithDetails[]>({
    queryKey: ['/api/cleaning-tasks'],
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Bookings</dt>
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

        {/* System Status */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-3" />
                  <span className="font-medium text-success-800">All Systems Operational</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Database</span>
                  <span className="text-success-600 font-medium">Online</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Authentication</span>
                  <span className="text-success-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="text-gray-600">2 hours ago</span>
                </div>
              </div>

              {(user.role === 'admin') && (
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-view-reports">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View System Reports
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Front Door Code Management - Only for Admin and Managers */}
       {(user.role === 'admin' || user.role === 'manager') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FrontDoorManager properties={properties || []} />
          </div>
        )}
    </div>
  );
}