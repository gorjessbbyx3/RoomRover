
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  propertyId: string;
  roomId?: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed';
  dateReported: string;
  dateCompleted?: string;
  reportedBy: string;
  assignedTo?: string;
  notes?: string;
}

interface Property {
  id: string;
  name: string;
}

interface Room {
  id: string;
  propertyId: string;
  roomNumber: number;
}

export default function MaintenanceManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    type: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: ''
  });

  const { data: maintenanceItems = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch maintenance items');
      return response.json();
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
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

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
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

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          roomId: data.roomId || null,
          status: 'open',
          reportedBy: user?.id
        })
      });
      if (!response.ok) throw new Error('Failed to create maintenance item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsAddDialogOpen(false);
      setFormData({
        propertyId: '',
        roomId: '',
        type: '',
        description: '',
        priority: 'medium',
        notes: ''
      });
      toast({
        title: 'Maintenance Item Created',
        description: 'Maintenance request has been successfully created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create maintenance item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceItem> }) => {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update maintenance item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsUpdateDialogOpen(false);
      setSelectedItem(null);
      toast({
        title: 'Maintenance Item Updated',
        description: 'Maintenance item has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update maintenance item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.type || !formData.description) {
      toast({
        title: 'Error',
        description: 'Property, type, and description are required.',
        variant: 'destructive',
      });
      return;
    }
    createMaintenanceMutation.mutate(formData);
  };

  const handleStatusUpdate = (item: MaintenanceItem, newStatus: MaintenanceItem['status']) => {
    const updateData: Partial<MaintenanceItem> = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.dateCompleted = new Date().toISOString();
    }
    updateMaintenanceMutation.mutate({ id: item.id, data: updateData });
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : propertyId;
  };

  const getRoomNumber = (roomId: string) => {
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? `Room ${room.roomNumber}` : roomId;
  };

  const filteredRooms = rooms.filter((room: Room) => 
    formData.propertyId ? room.propertyId === formData.propertyId : true
  );

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin or manager role required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Maintenance Management
        </h1>
        <p className="text-gray-600 mt-2">
          Track and manage maintenance requests and repairs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {maintenanceItems.filter((item: MaintenanceItem) => item.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {maintenanceItems.filter((item: MaintenanceItem) => item.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {maintenanceItems.filter((item: MaintenanceItem) => item.priority === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {maintenanceItems.filter((item: MaintenanceItem) => item.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {maintenanceItems.length} maintenance item{maintenanceItems.length !== 1 ? 's' : ''}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Maintenance Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
              <DialogDescription>
                Report a new maintenance issue or request.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="propertyId">Property *</Label>
                <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value, roomId: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="roomId">Room (Optional)</Label>
                <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room (if applicable)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRooms.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as typeof formData.priority }))}>
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
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the maintenance issue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or instructions"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMaintenanceMutation.isPending}>
                  {createMaintenanceMutation.isPending ? 'Creating...' : 'Create Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Items</CardTitle>
          <CardDescription>
            Track the status and progress of all maintenance requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading maintenance items...</div>
          ) : maintenanceItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No maintenance items found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property/Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceItems.map((item: MaintenanceItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getPropertyName(item.propertyId)}</div>
                        {item.roomId && (
                          <div className="text-sm text-gray-500">{getRoomNumber(item.roomId)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={item.description}>
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(item.priority)}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(item.dateReported).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(item, 'in_progress')}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {item.status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(item, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
