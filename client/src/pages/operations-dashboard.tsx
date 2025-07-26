import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
  Zap,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Settings,
  Fan
} from 'lucide-react';
import type { InventoryItem, MaintenanceItem, Room, Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function OperationsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProperty, setSelectedProperty] = useState('all');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    propertyId: user?.property || 'P1',
    item: '',
    quantity: 0,
    threshold: 5,
    unit: 'pieces',
    notes: ''
  });
  const [restockAmount, setRestockAmount] = useState(0);
  const [maintenanceRequest, setMaintenanceRequest] = useState({
    issue: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: ''
  });

  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch cleaning tasks
  const { data: cleaningTasks = [], isLoading: cleaningTasksLoading, error: cleaningTasksError } = useQuery({
    queryKey: ['/api/cleaning-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/cleaning-tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch cleaning tasks');
      return response.json();
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

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

      const validPriorities = ['low', 'medium', 'high', 'critical'];
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

  // Inventory mutations
  const addItemMutation = useMutation({
    mutationFn: async (itemData: typeof newItem) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddDialogOpen(false);
      setNewItem({
        propertyId: user?.property || 'P1',
        item: '',
        quantity: 0,
        threshold: 5,
        unit: 'pieces',
        notes: ''
      });
      toast({ title: "Success", description: "Inventory item added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsEditDialogOpen(false);
      setIsRestockDialogOpen(false);
      setCurrentItem(null);
      toast({ title: "Success", description: "Inventory item updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: "Success", description: "Inventory item deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Room mutations
  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, updates }: { roomId: string; updates: Partial<Room> }) => {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update room');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: "Success", description: "Room status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addMaintenanceRequestMutation = useMutation({
    mutationFn: async (requestData: typeof maintenanceRequest & { roomId: string; propertyId: string }) => {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...requestData,
          dateReported: new Date().toISOString(),
          status: 'open'
        })
      });
      if (!response.ok) throw new Error('Failed to create maintenance request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsMaintenanceDialogOpen(false);
      setMaintenanceRequest({
        issue: '',
        priority: 'medium',
        notes: ''
      });
      toast({ title: "Success", description: "Maintenance request created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Calculate key metrics
  const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
  const outOfStockItems = inventory.filter(item => item.quantity === 0);
  const criticalMaintenance = maintenance.filter(item => item.priority === 'critical' && item.status !== 'completed');
  const roomsNeedingCleaning = rooms.filter(room => room.cleaningStatus === 'dirty');
  const availableRooms = rooms.filter(room => room.status === 'available' && room.cleaningStatus === 'clean');
  const outOfOrderRooms = rooms.filter(room => room.status === 'maintenance');

  // Cleaning task metrics
  const pendingTasks = cleaningTasks.filter(task => task.status === 'pending');
  const inProgressTasks = cleaningTasks.filter(task => task.status === 'in_progress');
  const highPriorityTasks = cleaningTasks.filter(task => ['high', 'critical'].includes(task.priority) && task.status !== 'completed');

  const getStatusColor = (status: string, type: 'maintenance' | 'inventory' | 'room') => {
    if (type === 'maintenance') {
      // For maintenance items, status can be priority levels
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      const validStatuses = ['open', 'in_progress', 'completed'];

      if (validPriorities.includes(status)) {
        switch (status) {
          case 'critical': return 'bg-red-100 text-red-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      } else if (validStatuses.includes(status)) {
        switch (status) {
          case 'open': return 'bg-red-100 text-red-800';
          case 'in_progress': return 'bg-yellow-100 text-yellow-800';
          case 'completed': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }
      return 'bg-gray-100 text-gray-800';
    } else if (type === 'inventory') {
      // For inventory items
      const validStatuses = ['low_stock', 'out_of_stock', 'in_stock'];
      if (!validStatuses.includes(status)) return 'bg-gray-100 text-gray-800';

      switch (status) {
        case 'out_of_stock': return 'bg-red-100 text-red-800';
        case 'low_stock': return 'bg-yellow-100 text-yellow-800';
        case 'in_stock': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'room') {
      switch (status) {
        case 'available': return 'bg-green-100 text-green-800';
        case 'occupied': return 'bg-blue-100 text-blue-800';
        case 'cleaning': return 'bg-yellow-100 text-yellow-800';
        case 'maintenance': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
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

  if (roomsLoading || propertiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  const hasErrors = inventoryError || maintenanceError || roomsError || cleaningTasksError;
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
                  {cleaningTasksError && <p>Cleaning Tasks: {cleaningTasksError.message}</p>}
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
          title="Pending Tasks"
          count={pendingTasks.length}
          icon={ClipboardList}
          color="text-blue-600"
          action={() => setActiveTab('cleaning')}
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
          title="High Priority"
          count={highPriorityTasks.length}
          icon={Zap}
          color="text-red-600"
          action={() => setActiveTab('cleaning')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="cleaning" className="flex items-center gap-2">
            <Fan className="h-4 w-4" />
            Cleaning
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
                <CardTitle>Operations Summary</CardTitle>
                <CardDescription>
                  Current status overview of rooms, inventory, and maintenance
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
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="font-medium">Pending Cleaning Tasks</span>
                  <Badge className="bg-indigo-100 text-indigo-800">{pendingTasks.length} tasks</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <span className="font-medium">High Priority Tasks</span>
                  <Badge className="bg-pink-100 text-pink-800">{highPriorityTasks.length} tasks</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cleaning Tasks Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fan className="h-5 w-5 mr-2 text-blue-600" />
                Active Cleaning Tasks
              </CardTitle>
              <CardDescription>
                Current tasks requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cleaningTasksLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : [...pendingTasks, ...inProgressTasks].length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[...pendingTasks, ...inProgressTasks].slice(0, 5).map((task) => (
                    <div key={task.id} className={`border rounded-lg p-3 ${
                      task.priority === 'critical' ? 'border-red-200 bg-red-50' :
                      task.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">{task.type.replace('_', ' ')}</span>
                            {task.roomId && <span> • Room {task.roomId}</span>}
                          </div>
                          {task.dueDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={
                            task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {[...pendingTasks, ...inProgressTasks].length > 5 && (
                    <div className="text-center text-sm text-gray-500 pt-2 border-t">
                      {[...pendingTasks, ...inProgressTasks].length - 5} more tasks - 
                      <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setActiveTab('cleaning')}>
                        View all
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No active cleaning tasks</p>
                ```text

                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent valuee="rooms" className="space-y-6">
          {/* Group rooms by property and display in PropertyOverview style */}
          {properties
            .filter(property => selectedProperty === 'all' || property.id === selectedProperty)
            .map(property => {
              const propertyRooms = rooms
                .filter(room => room.propertyId === property.id)
                .filter(room => filterStatus === 'all' || room.status === filterStatus)
                .filter(room => room.id.toLowerCase().includes(searchTerm.toLowerCase()));

              if (propertyRooms.length === 0) return null;

              const gridCols = property.id === 'P1' ? 'grid-cols-4' : 'grid-cols-5';

              return (
                <Card key={property.id} className="shadow-material">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-medium text-gray-900">
                          {property.name} - Room Status Overview
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {property.description} • Real-time room availability and housekeeping status
                        </p>
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
                  <CardContent className="p-6">
                    <div className={`grid ${gridCols} gap-3`} data-testid={`rooms-grid-${property.id}`}>
                      {propertyRooms.map(room => {
                        const getStatusColor = () => {
                          switch (room.status) {
                            case 'available':
                              return room.cleaningStatus === 'clean' 
                                ? 'bg-green-100 border-green-300 hover:bg-green-200' 
                                : 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
                            case 'occupied':
                              return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
                            case 'cleaning':
                              return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
                            case 'maintenance':
                              return 'bg-red-100 border-red-300 hover:bg-red-200';
                            default:
                              return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
                          }
                        };

                        const getStatusTextColor = () => {
                          switch (room.status) {
                            case 'available':
                              return room.cleaningStatus === 'clean' ? 'text-green-800' : 'text-yellow-800';
                            case 'occupied':
                              return 'text-blue-800';
                            case 'cleaning':
                              return 'text-yellow-800';
                            case 'maintenance':
                              return 'text-red-800';
                            default:
                              return 'text-gray-800';
                          }
                        };

                        const getStatusDotColor = () => {
                          switch (room.status) {
                            case 'available':
                              return room.cleaningStatus === 'clean' ? 'bg-green-500' : 'bg-yellow-500';
                            case 'occupied':
                              return 'bg-blue-500';
                            case 'cleaning':
                              return 'bg-yellow-500';
                            case 'maintenance':
                              return 'bg-red-500';
                            default:
                              return 'bg-gray-500';
                          }
                        };

                        const statusLabel = room.status.charAt(0).toUpperCase() + room.status.slice(1);

                        return (
                          <Card 
                            key={room.id}
                            className={`border rounded-lg cursor-pointer transition-all hover:shadow-md p-4 ${getStatusColor()}`}
                            onClick={() => {
                              setSelectedRoom(room);
                              setIsRoomDialogOpen(true);
                            }}
                            data-testid={`room-card-${room.id}`}
                          >
                            <div className="text-center">
                              <div className={`font-medium text-sm ${getStatusTextColor()}`}>
                                {room.id}
                              </div>
                              <div className={`mt-1 text-sm ${getStatusTextColor()}`}>
                                {statusLabel}
                              </div>
                              <div className={`rounded-full mx-auto mt-2 w-3 h-3 ${getStatusDotColor()}`}></div>

                              {/* Additional room info */}
                              <div className="mt-2 space-y-1">
                                <div className={`text-xs ${getStatusTextColor()}`}>
                                  Cleaning: {room.cleaningStatus}
                                </div>
                                {room.lastCleaned && (
                                  <div className="text-xs text-gray-500">
                                    Cleaned: {new Date(room.lastCleaned).toLocaleDateString()}
                                  </div>
                                )}
                              </div>

                              {room.cleaningStatus === 'dirty' && (
                                <Button size="sm" className="w-full mt-2 text-xs" variant="outline">
                                  Clean
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {rooms.length === 0 && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center py-8 text-gray-500">
                  <Home className="h-12 w-12 mx-auto mb-2" />
                  No rooms found. Check your filters or contact administrator.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Supply Inventory</CardTitle>
                  <CardDescription>Track stock levels and get reorder alerts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" aria-describedby="add-inventory-description">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription id="add-inventory-description">
                Add a new item to the inventory system
              </DialogDescription>
            </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="property">Property</Label>
                          <Select value={newItem.propertyId} onValueChange={(value) => setNewItem({...newItem, propertyId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map(property => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="item">Item Name</Label>
                          <Input
                            id="item"
                            value={newItem.item}
                            onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                            placeholder="e.g., Towels, Sheet Sets"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="quantity">Initial Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="threshold">Low Stock Threshold</Label>
                            <Input
                              id="threshold"
                              type="number"
                              value={newItem.threshold}
                              onChange={(e) => setNewItem({...newItem, threshold: parseInt(e.target.value) || 5})}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={newItem.unit} onValueChange={(value) => setNewItem({...newItem, unit: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="sets">Sets</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                              <SelectItem value="rolls">Rolls</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={newItem.notes}
                            onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                            placeholder="Additional notes about this item"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => addItemMutation.mutate(newItem)} disabled={!newItem.item || addItemMutation.isPending}>
                          {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Group inventory by property */}
              {properties
                .filter(property => selectedProperty === 'all' || property.id === selectedProperty)
                .map(property => {
                  const propertyInventory = inventory.filter(item => item.propertyId === property.id);

                  if (propertyInventory.length === 0) return null;

                  return (
                    <div key={property.id} className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        {property.name}
                      </h3>
                      <div className="space-y-4">
                        {propertyInventory.map(item => {
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
                                  <h4 className="font-semibold">{item.item}</h4>
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
                                    {item.notes && (
                                      <span className="text-sm text-gray-400">
                                        • {item.notes}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
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

                                  {/* Restock Button */}
                                  <Dialog open={isRestockDialogOpen && currentItem?.id === item.id} onOpenChange={(open) => {
                                    setIsRestockDialogOpen(open);
                                    if (!open) setCurrentItem(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          setCurrentItem(item);
                                          setRestockAmount(0);
                                        }}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Restock
                                      </Button>
                                    </DialogTrigger>
                                     <DialogContent className="max-w-md" aria-describedby="restock-description">
            <DialogHeader>
              <DialogTitle>Restock {item.item}</DialogTitle>
              <DialogDescription id="restock-description">
                Update inventory quantity for selected item
              </DialogDescription>
            </DialogHeader>
                                      <div className="grid gap-4">
                                        <div className="grid gap-2">
                                          <Label>Current Stock: {item.quantity} {item.unit}</Label>
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="restock-amount">Add Quantity</Label>
                                          <Input
                                            id="restock-amount"
                                            type="number"
                                            value={restockAmount}
                                            onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                                            placeholder="Amount to add"
                                          />
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          New total: {item.quantity + restockAmount} {item.unit}
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={() => {
                                            updateItemMutation.mutate({
                                              id: item.id,
                                              updates: { quantity: item.quantity + restockAmount }
                                            });
                                          }}
                                          disabled={restockAmount <= 0 || updateItemMutation.isPending}
                                        >
                                          {updateItemMutation.isPending ? 'Updating...' : 'Update Stock'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Edit Button */}
                                  <Dialog open={isEditDialogOpen && currentItem?.id === item.id} onOpenChange={(open) => {
                                    setIsEditDialogOpen(open);
                                    if (!open) setCurrentItem(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setCurrentItem(item)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit {item.item}</DialogTitle>
                                        <DialogDescription>
                                          Update item details and thresholds
                                        </DialogDescription>
                                      </DialogHeader>
                                      {currentItem && (
                                        <div className="grid gap-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-item">Item Name</Label>
                                            <Input
                                              id="edit-item"
                                              value={currentItem.item}
                                              onChange={(e) => setCurrentItem({...currentItem, item: e.target.value})}
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                              <Label htmlFor="edit-quantity">Quantity</Label>
                                              <Input
                                                id="edit-quantity"
                                                type="number"
                                                value={currentItem.quantity}
                                                onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
                                              />
                                            </div>
                                            <div className="grid gap-2">
                                              <Label htmlFor="edit-threshold">Threshold</Label>
                                              <Input
                                                id="edit-threshold"
                                                type="number"
                                                value={currentItem.threshold}
                                                onChange={(e) => setCurrentItem({...currentItem, threshold: parseInt(e.target.value) || 5})}
                                              />
                                            </div>
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-notes">Notes</Label>
                                            <Textarea
                                              id="edit-notes"
                                              value={currentItem.notes || ''}
                                              onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={() => {
                                            if (currentItem) {
                                              updateItemMutation.mutate({
                                                id: currentItem.id,
                                                updates: {
                                                  item: currentItem.item,
                                                  quantity: currentItem.quantity,
                                                  threshold: currentItem.threshold,
                                                  notes: currentItem.notes
                                                }
                                              });
                                            }
                                          }}
                                          disabled={updateItemMutation.isPending}
                                        >
                                          {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Delete Button */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this item?')) {
                                        deleteItemMutation.mutate(item.id);
                                      }
                                    }}
                                    disabled={deleteItemMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {inventory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  No inventory items found. Add your first item to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Fan className="h-5 w-5 mr-2" />
                    Cleaning Task Management
                  </CardTitle>
                  <CardDescription>Manage cleaning tasks and schedules for all properties</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Cleaning Task</DialogTitle>
                      <DialogDescription>
                        Add a new cleaning task for rooms or common areas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="task-type">Task Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="room_cleaning">Room Cleaning</SelectItem>
                              <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                              <SelectItem value="maintenance_cleaning">Maintenance Cleaning</SelectItem>
                              <SelectItem value="common_area">Common Area</SelectItem>
                              <SelectItem value="laundry">Laundry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task-title">Task Title</Label>
                        <Input
                          id="task-title"
                          placeholder="e.g., Clean Room P1-R1, Vacuum Common Area"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="task-property">Property</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map(property => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-room">Room (Optional)</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No specific room</SelectItem>
                              {rooms.map(room => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          placeholder="Detailed description of the cleaning task..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task-due-date">Due Date (Optional)</Label>
                        <Input
                          id="task-due-date"
                          type="datetime-local"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">
                        Cancel
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Create Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Task Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Pending Tasks</p>
                      <p className="text-2xl font-bold text-yellow-800">{pendingTasks.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">In Progress</p>
                      <p className="text-2xl font-bold text-blue-800">{inProgressTasks.length}</p>
                    </div>
                    <Fan className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">High Priority</p>
                      <p className="text-2xl font-bold text-red-800">{highPriorityTasks.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Active Tasks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Tasks</h3>
                {cleaningTasksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : [...pendingTasks, ...inProgressTasks].length > 0 ? (
                  <div className="space-y-4">
                    {[...pendingTasks, ...inProgressTasks].map((task) => (
                      <div key={task.id} className={`border rounded-lg p-4 ${
                        task.priority === 'critical' ? 'border-red-200 bg-red-50' :
                        task.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                        'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{task.title}</h4>
                              <Badge className={
                                task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">{task.type.replace('_', ' ')}</span>
                              {task.roomId && <span> • Room {task.roomId}</span>}
                              {task.propertyId && properties.find(p => p.id === task.propertyId) && (
                                <span> • {properties.find(p => p.id === task.propertyId)?.name}</span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.dueDate && (
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              )}
                              {task.assignedTo && <span>Assigned</span>}
                              <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className={
                              task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {task.priority}
                            </Badge>
                            {task.status === 'pending' && (
                              <Button size="sm" variant="outline">
                                Start
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Fan className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No active cleaning tasks</p>
                  </div>
                )}
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
                <div className="flex gap-2">
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Wrench className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </DialogTrigger>
                     <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Report Maintenance Issue</DialogTitle>
                        <DialogDescription>
                          Create a new maintenance request with optional repeat schedule and inventory linking
                        </DialogDescription>
                      </DialogHeader>
                      {/* Maintenance Form */}
                      {/* Refactored to use react-hook-form */}
                      {/* Property Selection */}
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="maintenance-property">Property</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Properties</SelectItem>
                                {properties.map(property => (
                                  <SelectItem key={property.id} value={property.id}>
                                    {property.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="maintenance-room">Room (Optional)</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no_room">No specific room</SelectItem>
                                {rooms.map(room => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Issue and Priority */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="maintenance-issue">Issue Title</Label>
                            <Input
                              id="maintenance-issue"
                              placeholder="Brief description of the issue"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="maintenance-priority">Priority</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority                              </SelectTrigger>
                              <SelectContent>
                               <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                          <Label htmlFor="maintenance-description">Detailed Description</Label>
                          <Textarea
                            id="maintenance-description"
                            placeholder="Provide detailed information about the maintenance issue..."
                            className="min-h-[100px]"
                          />
                        </div>

                        {/* Due Date */}
                        <div className="grid gap-2">
                          <Label htmlFor="maintenance-due-date">Due Date (Optional)</Label>
                          <Input
                            id="maintenance-due-date"
                            type="datetime-local"
                          />
                        </div>

                        {/* Repeat Schedule Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="enable-repeat" className="rounded" />
                            <Label htmlFor="enable-repeat" className="font-medium">Enable Repeat Schedule</Label>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="repeat-frequency">Frequency</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="repeat-interval">Every</Label>
                              <Input
                                id="repeat-interval"
                                type="number"
                                min="1"
                                placeholder="1"
                                defaultValue="1"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="repeat-end">End Date</Label>
                              <Input
                                id="repeat-end"
                                type="date"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Inventory Linking Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <Label className="font-medium">Link Inventory Items (Optional)</Label>
                          <p className="text-sm text-gray-600">Select items that may be needed for this maintenance task</p>

                          <div className="grid gap-2 max-h-40 overflow-y-auto border rounded p-2">
                            {inventory.map(item => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  id={`inventory-${item.id}`}
                                  className="rounded"
                                />
                                <Label htmlFor={`inventory-${item.id}`} className="text-sm flex-1">
                                  {item.item} - {item.quantity} {item.unit} available
                                  {item.quantity <= item.threshold && (
                                    <span className="text-orange-600 ml-2">(Low Stock)</span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-gray-500">
                            Selected items will be flagged when maintenance is scheduled and can help with inventory planning.
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">
                          Cancel
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700">
                          <Wrench className="h-4 w-4 mr-2" />
                          Create Maintenance Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Always show both properties, even if no maintenance items */}
              {properties.map(property => {
                const propertyMaintenance = maintenance
                  .filter(item => item.propertyId === property.id)
                  .filter(item => selectedProperty === 'all' || property.id === selectedProperty)
                  .filter(item => item.status !== 'completed')
                  .sort((a, b) => {
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  });

                // Skip if property is filtered out
                if (selectedProperty !== 'all' && selectedProperty !== property.id) {
                  return null;
                }

                return (
                  <div key={property.id} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        {property.name}
                        <span className="text-sm text-gray-500 ml-2">({property.id})</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {propertyMaintenance.length} open items
                        </Badge>
                        {propertyMaintenance.filter(item => item.priority === 'critical').length > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {propertyMaintenance.filter(item => item.priority === 'critical').length} critical
                          </Badge>
                        )}
                        {propertyMaintenance.filter(item => item.priority === 'high').length > 0 && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            {propertyMaintenance.filter(item => item.priority === 'high').length} high
                          </Badge>
                        )}
                      </div>
                    </div>

                    {propertyMaintenance.length > 0 ? (
                      <div className="space-y-4">
                        {propertyMaintenance.map(item => (
                          <div key={item.id} className={`border rounded-lg p-4 ${
                            item.priority === 'critical' ? 'border-red-200 bg-red-50' :
                            item.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                            item.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                            'border-gray-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{item.issue}</h4>
                                  <Badge className={getStatusColor(item.priority, 'maintenance')}>
                                    {item.priority}
                                  </Badge>
                                  {item.roomId && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.roomId}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  Reported {new Date(item.dateReported).toLocaleDateString()}
                                  {item.reportedBy && <span> by Staff</span>}
                                  {item.description && (
                                    <div className="mt-1 text-gray-500 bg-white bg-opacity-50 p-2 rounded text-xs">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Days open: {Math.floor((new Date().getTime() - new Date(item.dateReported).getTime()) / (1000 * 60 * 60 * 24))}</span>
                                  {item.assignedTo && <span>Assigned</span>}
                                  <span className="capitalize">{item.status.replace('_', ' ')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Update
                                </Button>
                                {item.status === 'open' && (
                                  <Button size="sm" variant="outline" className="text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No open maintenance requests</p>
                        <p className="text-xs text-gray-400">Property is in good condition</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Show message only when no properties match filter */}
              {selectedProperty !== 'all' && !properties.find(p => p.id === selectedProperty) && (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No properties found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Room Status Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {selectedRoom?.id} - Room Management
            </DialogTitle>
            <DialogDescription>
              Update room status and request maintenance
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Current Status</Label>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedRoom.status, 'room')}>
                    {selectedRoom.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Cleaning: {selectedRoom.cleaningStatus}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="room-status">Update Status</Label>
                <Select 
                  value={selectedRoom.status} 
                  onValueChange={(value) => {
                    updateRoomMutation.mutate({
                      roomId: selectedRoom.id,
                      updates: { status: value as Room['status'] }
                    });
                    setSelectedRoom({...selectedRoom, status: value as Room['status']});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cleaning-status">Cleaning Status</Label>
                <Select 
                  value={selectedRoom.cleaningStatus} 
                  onValueChange={(value) => {
                    updateRoomMutation.mutate({
                      roomId: selectedRoom.id,
                      updates: { cleaningStatus: value as Room['cleaningStatus'] }
                    });
                    setSelectedRoom({...selectedRoom, cleaningStatus: value as Room['cleaningStatus']});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRoom.lastCleaned && (
                <div className="text-sm text-gray-600">
                  Last cleaned: {new Date(selectedRoom.lastCleaned).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsMaintenanceDialogOpen(true);
                setIsRoomDialogOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Request Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
       <DialogContent className="max-w-md" aria-describedby="maintenance-dialog-description">
              <DialogHeader>
                <DialogTitle>Record Maintenance Issue</DialogTitle>
                <DialogDescription id="maintenance-dialog-description">
                  Report a new maintenance issue that needs attention
                </DialogDescription>
              </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="issue">Issue Title</Label>
              <Input
                id="issue"
                value={maintenanceRequest.issue}
                onChange={(e) => setMaintenanceRequest({...maintenanceRequest, issue: e.target.value})}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={maintenanceRequest.priority} 
                onValueChange={(value) => setMaintenanceRequest({...maintenanceRequest, priority: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes & Details</Label>
              <Textarea
                id="notes"
                value={maintenanceRequest.notes}
                onChange={(e) => setMaintenanceRequest({...maintenanceRequest, notes: e.target.value})}
                placeholder="Detailed description of the issue, including any specific problems or requirements..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsMaintenanceDialogOpen(false);
                setMaintenanceRequest({
                  issue: '',
                  priority: 'medium',
                  notes: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRoom && maintenanceRequest.issue.trim()) {
                  addMaintenanceRequestMutation.mutate({
                    ...maintenanceRequest,
                    roomId: selectedRoom.id,
                    propertyId: selectedRoom.propertyId
                  });
                }
              }}
              disabled={!maintenanceRequest.issue.trim() || addMaintenanceRequestMutation.isPending}
            >
              {addMaintenanceRequestMutation.isPending ? 'Creating...' : 'Create Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}