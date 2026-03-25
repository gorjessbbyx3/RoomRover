import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/status-badge';
import { DashboardStats, RoomWithDetails, CleaningTaskWithDetails, PropertyWithRooms } from '@/lib/types';
import {
  CheckCircle,
  Clock,
  Bed,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Fan,
  HandCoins,
  Key,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import FrontDoorManager from '@/components/front-door-manager';
import AddTaskDialog from '@/components/add-task-dialog';

const fetchWithAuth = async (url: string) => {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => fetchWithAuth('/api/dashboard/stats'),
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<RoomWithDetails[]>({
    queryKey: ['/api/rooms'],
    queryFn: () => fetchWithAuth('/api/rooms'),
    refetchInterval: 30000,
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyWithRooms[]>({
    queryKey: ['/api/properties'],
    queryFn: () => fetchWithAuth('/api/properties'),
    refetchInterval: 30000,
  });

  const { data: cleaningTasks, isLoading: tasksLoading } = useQuery<CleaningTaskWithDetails[]>({
    queryKey: ['/api/cleaning-tasks'],
    queryFn: () => fetchWithAuth('/api/cleaning-tasks'),
    refetchInterval: 30000,
  });

  if (!user) return null;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const pendingTasks = cleaningTasks?.filter(t => t.status === 'pending') || [];
  const highPriorityTasks = pendingTasks.filter(t => ['high', 'critical'].includes(t.priority));

  const occupiedRooms = rooms?.filter(r => r.status === 'occupied') || [];
  const availableRooms = rooms?.filter(r => r.status === 'available') || [];
  const cleaningRooms = rooms?.filter(r => r.status === 'cleaning') || [];
  const maintenanceRooms = rooms?.filter(r => r.status === 'maintenance') || [];
  const totalRooms = rooms?.length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms.length / totalRooms) * 100) : 0;

  const propertiesWithRooms: PropertyWithRooms[] = properties?.map(p => ({
    ...p,
    rooms: rooms?.filter(r => r.propertyId === p.id) || [],
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name}
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {user.role === 'admin' ? 'All Properties' : user.property || 'Overview'}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-300">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Occupancy Rate */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Occupancy</span>
              </div>
              {statsLoading ? <Skeleton className="h-9 w-20" /> : (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">{occupancyRate}%</span>
                  <span className="text-xs text-slate-500 mb-1">{occupiedRooms.length}/{totalRooms}</span>
                </div>
              )}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>
          </div>

          {/* Available Rooms */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Bed className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available</span>
              </div>
              {statsLoading ? <Skeleton className="h-9 w-16" /> : (
                <span className="text-3xl font-bold text-slate-900">{availableRooms.length}</span>
              )}
              <p className="text-xs text-emerald-600 mt-1 font-medium">Ready for guests</p>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</span>
              </div>
              {statsLoading ? <Skeleton className="h-9 w-16" /> : (
                <span className="text-3xl font-bold text-slate-900">{stats?.activeBookings || 0}</span>
              )}
              <p className="text-xs text-violet-600 mt-1 font-medium">Current memberships</p>
            </div>
          </div>

          {/* Revenue Today */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today</span>
              </div>
              {statsLoading ? <Skeleton className="h-9 w-24" /> : (
                <span className="text-3xl font-bold text-slate-900">{fmt(stats?.todayRevenue || 0)}</span>
              )}
              {stats?.paymentMethodBreakdown && (
                <p className="text-xs text-slate-500 mt-1">
                  Cash {fmt(stats.paymentMethodBreakdown.cash || 0)} · App {fmt(stats.paymentMethodBreakdown.cashApp || 0)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Room Status Grid + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Room Status Visual Map */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Room Status</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live room overview across properties</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Occupied</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Cleaning</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Maintenance</span>
              </div>
            </div>
            <div className="p-6">
              {roomsLoading || propertiesLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              ) : (
                <div className="space-y-6">
                  {propertiesWithRooms
                    .filter(p => user.role === 'admin' || user.property === p.id)
                    .map(property => (
                    <div key={property.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-700">{property.name}</h3>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {property.rooms.filter(r => r.status === 'occupied').length}/{property.rooms.length} occupied
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {property.rooms.map(room => {
                          const statusColor = room.status === 'available' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
                            room.status === 'occupied' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                            room.status === 'cleaning' ? 'bg-amber-100 border-amber-300 text-amber-700' :
                            'bg-red-100 border-red-300 text-red-700';
                          return (
                            <div
                              key={room.id}
                              className={`${statusColor} border rounded-xl p-2.5 text-center cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105`}
                              title={`${room.id} - ${room.status}`}
                            >
                              <div className="text-xs font-bold">{room.roomNumber}</div>
                              <div className="text-[10px] opacity-75 capitalize mt-0.5">{room.status}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alerts Column */}
          <div className="space-y-4">
            {/* Payment Alerts */}
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" /> Alerts
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {statsLoading ? <Skeleton className="h-16" /> : (
                  <>
                    {(stats?.overduePaymentsCount || 0) > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">{stats?.overduePaymentsCount} Overdue</p>
                          <p className="text-xs text-red-600">{fmt(stats?.overduePaymentsAmount || 0)} outstanding</p>
                        </div>
                      </div>
                    )}
                    {(stats?.pendingPaymentsCount || 0) > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">{stats?.pendingPaymentsCount} Pending</p>
                          <p className="text-xs text-amber-600">{fmt(stats?.pendingPaymentsAmount || 0)} awaiting</p>
                        </div>
                      </div>
                    )}
                    {highPriorityTasks.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <Fan className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">{highPriorityTasks.length} Urgent Tasks</p>
                          <p className="text-xs text-orange-600">Requires immediate attention</p>
                        </div>
                      </div>
                    )}
                    {(stats?.overduePaymentsCount || 0) === 0 && (stats?.pendingPaymentsCount || 0) === 0 && highPriorityTasks.length === 0 && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">All Clear</p>
                          <p className="text-xs text-emerald-600">No issues requiring attention</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Payment System</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Cash App</span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">$selarazmami</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Cleaning Queue</span>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{cleaningRooms.length} rooms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Maintenance</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${maintenanceRooms.length > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                    {maintenanceRooms.length > 0 ? `${maintenanceRooms.length} issues` : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cleaning Tasks + Cash Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Pending Tasks</h2>
                <p className="text-xs text-slate-500 mt-0.5">{pendingTasks.length} tasks · {highPriorityTasks.length} high priority</p>
              </div>
              {(user.role === 'admin' || user.role === 'manager') && (
                <AddTaskDialog
                  trigger={
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-8 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                    </Button>
                  }
                />
              )}
            </div>
            <div className="p-4">
              {tasksLoading ? (
                <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
              ) : pendingTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className={`rounded-xl p-3.5 border transition-colors ${
                        task.priority === 'critical' ? 'bg-red-50/50 border-red-200' :
                        task.priority === 'high' ? 'bg-amber-50/50 border-amber-200' :
                        'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{task.title}</h4>
                          {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={task.priority} type="priority" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Fan className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">All clear — no pending tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Manager Cash Drawer - Admin Only */}
          {user.role === 'admin' ? (
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-amber-500" /> Cash Drawer Monitoring
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time manager holdings</p>
              </div>
              <div className="p-4">
                {statsLoading ? (
                  <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
                ) : stats?.cashDrawerStats && stats.cashDrawerStats.length > 0 ? (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs text-slate-500">Total Holdings</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">
                          {fmt(stats.cashDrawerStats.reduce((s, d) => s + d.currentCashHolding, 0))}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs text-slate-500">Today's Collections</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">
                          {fmt(stats.cashDrawerStats.reduce((s, d) => s + d.totalCashCollectedToday, 0))}
                        </p>
                      </div>
                    </div>
                    {stats.cashDrawerStats.map(d => (
                      <div key={d.managerId} className="rounded-xl p-3.5 border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{d.managerName}</p>
                            <p className="text-xs text-slate-500">{d.property}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            d.currentCashHolding > 200 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {fmt(d.currentCashHolding)}
                          </span>
                        </div>
                        {d.currentCashHolding > 200 && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> Consider requesting turn-in
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <HandCoins className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No active cash holdings</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Front Door Codes for managers */
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-500" /> Front Door Codes
                </h2>
              </div>
              <div className="p-4">
                {propertiesLoading ? <Skeleton className="h-20" /> : <FrontDoorManager properties={properties || []} />}
              </div>
            </div>
          )}
        </div>

        {/* Front Door Codes for Admin */}
        {user.role === 'admin' && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-500" /> Front Door Code Management
              </h2>
            </div>
            <div className="p-6">
              {propertiesLoading ? <Skeleton className="h-20" /> : <FrontDoorManager properties={properties || []} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
