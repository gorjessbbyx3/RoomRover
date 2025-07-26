import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wrench, 
  Home,
  Search,
  Filter,
  TrendingDown,
  ShoppingCart,
  ClipboardList,
  Zap
} from 'lucide-react';
import type { InventoryItem, MaintenanceItem, Room } from '@/lib/types';

interface InventoryItem {
  id: string;
  propertyId: string;
  item: string;
  quantity: number;
  threshold: number;
  unit: string;
  lastUpdated: string;
}

interface MaintenanceItem {
  id: string;
  propertyId: string;
  roomId?: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed';
  dateReported: string;
}

interface Room {
  id: string;
  propertyId: string;
  roomNumber: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  cleaningStatus: 'clean' | 'dirty' | 'in_progress';
  lastCleaned: string | null;
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data based on user role with comprehensive error handling
  const { data: inventory = [], isLoading: inventoryLoading, error: inventoryError } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch inventory`);
      }
      const data = await response.json();

      // Validate inventory data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid inventory data format - expected array');
      }

      return data.map((item, index) => {
        if (!item.id || !item.item || typeof item.quantity !== 'number') {
          console.warn(`Invalid inventory item at index ${index}:`, item);
        }
        return {
          ...item,
          quantity: Math.max(0, Number(item.quantity) || 0),
          threshold: Math.max(0, Number(item.threshold) || 5),
          lastUpdated: item.lastUpdated || new Date().toISOString()
        };
      });
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: maintenance = [], isLoading: maintenanceLoading, error: maintenanceError } = useQuery<MaintenanceItem[]>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch maintenance`);
      }
      const data = await response.json();

      // Validate maintenance data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid maintenance data format - expected array');
      }

      const validPriorities = ['critical', 'high', 'medium', 'low'];
      const validStatuses = ['open', 'in_progress', 'completed'];

      return data.map((item, index) => {
        if (!item.id || !item.issue) {
          console.warn(`Invalid maintenance item at index ${index}:`, item);
        }
        return {
          ...item,
          priority: validPriorities.includes(item.priority) ? item.priority : 'medium',
          status: validStatuses.includes(item.status) ? item.status : 'open',
          dateReported: item.dateReported || new Date().toISOString()
        };
      });
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch rooms`);
      }
      const data = await response.json();

      // Validate room data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid rooms data format - expected array');
      }

      const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance'];
      const validCleaningStatuses = ['clean', 'dirty', 'in_progress'];

      return data.map((room, index) => {
        if (!room.id || !room.propertyId) {
          console.warn(`Invalid room at index ${index}:`, room);
        }
        return {
          ...room,
          status: validStatuses.includes(room.status) ? room.status : 'available',
          cleaningStatus: validCleaningStatuses.includes(room.cleaningStatus) ? room.cleaningStatus : 'clean',
          roomNumber: Number(room.roomNumber) || index + 1,
          lastCleaned: room.lastCleaned || null
        };
      });
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for rooms (more dynamic)
  });

  // Calculate key metrics
  const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
  const outOfStockItems = inventory.filter(item => item.quantity === 0);
  const criticalMaintenance = maintenance.filter(item => item.priority === 'critical' && item.status !== 'completed');
  const roomsNeedingCleaning = rooms.filter(room => room.cleaningStatus === 'dirty');
  const availableRooms = rooms.filter(room => room.status === 'available' && room.cleaningStatus === 'clean');
  const outOfOrderRooms = rooms.filter(room => room.status === 'maintenance');

  const getStatusColor = (status: string, type: 'inventory' | 'maintenance' | 'room') => {
    if (type === 'inventory') {
      if (status === 'out') return 'bg-red-100 text-red-800';
      if (status === 'low') return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    }
    if (type === 'maintenance') {
      if (status === 'critical') return 'bg-red-100 text-red-800';
      if (status === 'high') return 'bg-orange-100 text-orange-800';
      if (status === 'medium') return 'bg-yellow-100 text-yellow-800';
      return 'bg-blue-100 text-blue-800';
    }
    if (type === 'room') {
      if (status === 'available') return 'bg-green-100 text-green-800';
      if (status === 'occupied') return 'bg-blue-100 text-blue-800';
      if (status === 'cleaning') return 'bg-yellow-100 text-yellow-800';
      if (status === 'maintenance') return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const QuickActionCard = ({ title, count, icon: Icon, color, action }: any) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={action}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const AlertsList = () => (
    <div className="space-y-3">
      {criticalMaintenance.map(item => (
        <div key={item.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <div className="flex-1">
            <p className="font-medium text-red-800">{item.issue}</p>
            <p className="text-sm text-red-600">Room {item.roomId} - {item.priority} priority</p>
          </div>
          <Badge className="bg-red-100 text-red-800">URGENT</Badge>
        </div>
      ))}

      {outOfStockItems.map(item => (
        <div key={item.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <Package className="h-5 w-5 text-red-600 mr-3" />
          <div className="flex-1">
            <p className="font-medium text-red-800">{item.item}</p>
            <p className="text-sm text-red-600">Out of stock - needs immediate reorder</p>
          </div>
          <Badge className="bg-red-100 text-red-800">OUT</Badge>
        </div>
      ))}

      {lowStockItems.filter(item => item.quantity > 0).map(item => (
        <div key={item.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <TrendingDown className="h-5 w-5 text-yellow-600 mr-3" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">{item.item}</p>
            <p className="text-sm text-yellow-600">{item.quantity} {item.unit} remaining (threshold: {item.threshold})</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">LOW</Badge>
        </div>
      ))}
    </div>
  );

  // Show loading state
  if (inventoryLoading || maintenanceLoading || roomsLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading operational data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  const hasErrors = inventoryError || maintenanceError || roomsError;
  if (hasErrors) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium text-red-800">Data Loading Errors</h3>
                <div className="mt-2 text-sm text-red-700 space-y-1">
                  {inventoryError && <p>Inventory: {inventoryError.message}</p>}
                  {maintenanceError && <p>Maintenance: {maintenanceError.message}</p>}
                  {roomsError && <p>Rooms: {roomsError.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <Button onClick={() => window.location.reload()}>
            Retry Loading Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Unified view of inventory, room status, and maintenance for {user?.property || 'all properties'}
        </p>
        {/* Data freshness indicator */}
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()} | 
          Role: {user?.role} | 
          Property: {user?.property || 'All'}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <QuickActionCard
          title="Available Rooms"
          count={availableRooms.length}
          icon={CheckCircle}
          color="text-green-600"
          action={() => setActiveTab('rooms')}
        />
        <QuickActionCard
          title="Need Cleaning"
          count={roomsNeedingCleaning.length}
          icon={Clock}
          color="text-yellow-600"
          action={() => setActiveTab('rooms')}
        />
        <QuickActionCard
          title="Out of Order"
          count={outOfOrderRooms.length}
          icon={Wrench}
          color="text-red-600"
          action={() => setActiveTab('maintenance')}
        />
        <QuickActionCard
          title="Low Stock"
          count={lowStockItems.length}
          icon={TrendingDown}
          color="text-orange-600"
          action={() => setActiveTab('inventory')}
        />
        <QuickActionCard
          title="Critical Issues"
          count={criticalMaintenance.length}
          icon={AlertTriangle}
          color="text-red-600"
          action={() => setActiveTab('maintenance')}
        />
        <QuickActionCard
          title="Reorder Needed"
          count={outOfStockItems.length}
          icon={ShoppingCart}
          color="text-red-600"
          action={() => setActiveTab('inventory')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Data Quality Status */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Data Quality Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{inventory.length}</div>
                  <div className="text-blue-700">Inventory Items</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{rooms.length}</div>
                  <div className="text-blue-700">Rooms Tracked</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{maintenance.length}</div>
                  <div className="text-blue-700">Maintenance Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Zap className="h-5 w-5 mr-2" />
                  Urgent Alerts
                </CardTitle>
                <CardDescription>
                  Critical issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {criticalMaintenance.length === 0 && outOfStockItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    No urgent alerts
                  </div>
                ) : (
                  <AlertsList />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>
                  Quick overview of rooms and supplies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Ready to Book</span>
                  <Badge className="bg-green-100 text-green-800">{availableRooms.length} rooms</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium">Awaiting Housekeeping</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{roomsNeedingCleaning.length} rooms</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Total Inventory Items</span>
                  <Badge className="bg-blue-100 text-blue-800">{inventory.length} items</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">Open Maintenance</span>
                  <Badge className="bg-purple-100 text-purple-800">{maintenance.filter(m => m.status !== 'completed').length} items</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Room Status Overview</CardTitle>
                  <CardDescription>Real-time room availability and housekeeping status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms
                  .filter(room => filterStatus === 'all' || room.status === filterStatus)
                  .filter(room => room.id.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(room => (
                    <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{room.id}</h3>
                          <p className="text-sm text-gray-600">Room {room.roomNumber}</p>
                        </div>
                        <Badge className={getStatusColor(room.status, 'room')}>
                          {room.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cleaning:</span>
                          <Badge 
                            size="sm" 
                            className={getStatusColor(room.cleaningStatus === 'clean' ? 'available' : 'cleaning', 'room')}
                          >
                            {room.cleaningStatus}
                          </Badge>
                        </div>
                        {room.lastCleaned && (
                          <p className="text-xs text-gray-500">
                            Last cleaned: {new Date(room.lastCleaned).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {room.cleaningStatus === 'dirty' && (
                        <Button size="sm" className="w-full mt-3" variant="outline">
                          Schedule Cleaning
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Supply Inventory</CardTitle>
                  <CardDescription>Track stock levels and get reorder alerts</CardDescription>
                </div>
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.map(item => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity <= item.threshold && item.quantity > 0;

                  return (
                    <div key={item.id} className={`border rounded-lg p-4 ${
                      isOutOfStock ? 'border-red-200 bg-red-50' : 
                      isLowStock ? 'border-yellow-200 bg-yellow-50' : 
                      'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.item}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`text-lg font-bold ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {item.quantity} {item.unit}
                            </span>
                            <span className="text-sm text-gray-500">
                              Threshold: {item.threshold} {item.unit}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            isOutOfStock ? 'bg-red-100 text-red-800' :
                            isLowStock ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {isOutOfStock ? 'OUT' : isLowStock ? 'LOW' : 'OK'}
                          </Badge>
                          {(isOutOfStock || isLowStock) && (
                            <Button size="sm" variant="outline">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Maintenance Requests</CardTitle>
                  <CardDescription>Track and manage property maintenance issues</CardDescription>
                </div>
                <Button>
                  <Wrench className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenance
                  .filter(item => item.status !== 'completed')
                  .sort((a, b) => {
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map(item => {
                    const validPriorities = ['critical', 'high', 'medium', 'low'];
                    return (
                    <div key={item.id} className={`border rounded-lg p-4 ${
                      item.priority === 'critical' ? 'border-red-200 bg-red-50' :
                      item.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{item.issue}</h3>
                            <Badge className={
                              item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {validPriorities.includes(item.priority) ? item.priority.toUpperCase() : 'UNKNOWN'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.roomId && <span>Room {item.roomId} • </span>}
                            Reported {new Date(item.dateReported).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}