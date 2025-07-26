
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building, 
  Search, 
  Users, 
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PropertyWithRooms } from '@/lib/types';

export default function ManagerListingsTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['manager-properties', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/properties?managerId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('DELETE', `/api/properties/${propertyId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Property Deleted',
        description: 'Property has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['manager-properties'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete property.',
      });
    },
  });

  const filteredProperties = properties.filter((property: PropertyWithRooms) =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOccupancyRate = (property: PropertyWithRooms) => {
    const totalRooms = property.rooms.length;
    const occupiedRooms = property.rooms.filter(room => room.status === 'occupied').length;
    return totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            My Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            My Properties ({filteredProperties.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProperties.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No properties match your search.' : 'You have no properties assigned.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Front Door</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property: PropertyWithRooms) => {
                  const occupancyRate = getOccupancyRate(property);
                  
                  return (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {property.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {property.rooms.length} total
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {property.rooms.slice(0, 3).map((room) => (
                              <Badge 
                                key={room.id} 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(room.status)}`}
                              >
                                {room.roomNumber}
                              </Badge>
                            ))}
                            {property.rooms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{property.rooms.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{occupancyRate}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                occupancyRate > 80 ? 'bg-green-500' :
                                occupancyRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          ${property.rateDaily}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-mono">
                            {property.frontDoorCode}
                          </div>
                          {property.codeExpiry && (
                            <div className="text-xs text-gray-500">
                              Expires: {new Date(property.codeExpiry).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Property
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deletePropertyMutation.mutate(property.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Edit, DoorOpen, Users, Calendar, DollarSign } from "lucide-react";
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

interface Room {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  cleaningStatus: string;
  doorCode?: string;
  codeExpiry?: string;
  lastCleaned?: string;
}

interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  startDate: string;
  endDate?: string;
  plan: string;
  totalAmount: string;
  paymentStatus: string;
  status: string;
}

export function ManagerListingsTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  // Fetch rooms for manager's property
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
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

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    }
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async (data: { roomId: string; updates: Partial<Room> }) => {
      const response = await fetch(`/api/rooms/${data.roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data.updates)
      });
      if (!response.ok) throw new Error('Failed to update room');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setUpdateDialogOpen(false);
      toast({
        title: "Success",
        description: "Room updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive"
      });
    }
  });

  // Generate door code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: { roomId: string; duration: string }) => {
      const response = await fetch(`/api/rooms/${data.roomId}/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ duration: data.duration })
      });
      if (!response.ok) throw new Error('Failed to generate code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Door code generated successfully"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentBooking = (roomId: string) => {
    return bookings.find((booking: Booking) => 
      booking.roomId === roomId && booking.status === 'active'
    );
  };

  if (roomsLoading || bookingsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            My Property Listings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Guest</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room: Room) => {
                const currentBooking = getCurrentBooking(room.id);
                
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      Room {room.number}
                    </TableCell>
                    <TableCell className="capitalize">
                      {room.type}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(room.status)}>
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currentBooking ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{currentBooking.guestName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No guest</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentBooking?.endDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(currentBooking.endDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentBooking ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>${currentBooking.totalAmount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">$0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRoom(room);
                            setUpdateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateCodeMutation.mutate({
                            roomId: room.id,
                            duration: 'monthly'
                          })}
                          disabled={generateCodeMutation.isPending}
                        >
                          <DoorOpen className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Room Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Room {selectedRoom?.number}</DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select 
                  defaultValue={selectedRoom.status}
                  onValueChange={(value) => {
                    setSelectedRoom({ ...selectedRoom, status: value as any });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cleaning Status</Label>
                <Select 
                  defaultValue={selectedRoom.cleaningStatus}
                  onValueChange={(value) => {
                    setSelectedRoom({ ...selectedRoom, cleaningStatus: value });
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

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateRoomMutation.mutate({
                      roomId: selectedRoom.id,
                      updates: {
                        status: selectedRoom.status,
                        cleaningStatus: selectedRoom.cleaningStatus
                      }
                    });
                  }}
                  disabled={updateRoomMutation.isPending}
                >
                  {updateRoomMutation.isPending ? 'Updating...' : 'Update Room'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
