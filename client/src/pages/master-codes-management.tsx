
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Edit, Shield } from 'lucide-react';

interface Room {
  id: string;
  propertyId: string;
  roomNumber: number;
  status: string;
  doorCode: string | null;
  masterCode?: string;
}

interface Property {
  id: string;
  name: string;
}

export default function MasterCodesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editCode, setEditCode] = useState('');

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const roomsData = await response.json();
      
      // Set default master code to 1234 if not set
      return roomsData.map((room: Room) => ({
        ...room,
        masterCode: room.masterCode || '1234'
      }));
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

  const updateMasterCodeMutation = useMutation({
    mutationFn: async ({ roomId, masterCode }: { roomId: string; masterCode: string }) => {
      const response = await fetch(`/api/rooms/${roomId}/master-code`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ masterCode })
      });
      if (!response.ok) throw new Error('Failed to update master code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
      setEditCode('');
      toast({
        title: 'Master Code Updated',
        description: 'Room master code has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update master code. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : propertyId;
  };

  const handleEditClick = (room: Room) => {
    setSelectedRoom(room);
    setEditCode(room.masterCode || '1234');
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !editCode || editCode.length !== 4) {
      toast({
        title: 'Error',
        description: 'Master code must be exactly 4 digits.',
        variant: 'destructive',
      });
      return;
    }
    updateMasterCodeMutation.mutate({
      roomId: selectedRoom.id,
      masterCode: editCode
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Admin access required</p>
        </div>
      </div>
    );
  }

  // Group rooms by property
  const roomsByProperty = rooms.reduce((acc: Record<string, Room[]>, room) => {
    if (!acc[room.propertyId]) {
      acc[room.propertyId] = [];
    }
    acc[room.propertyId].push(room);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="h-8 w-8" />
          Room Master Codes Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage master door codes for each room. These codes are separate from assigned guest door codes.
        </p>
      </div>

      {Object.entries(roomsByProperty).map(([propertyId, propertyRooms]) => (
        <Card key={propertyId} className="mb-6">
          <CardHeader>
            <CardTitle>{getPropertyName(propertyId)}</CardTitle>
            <CardDescription>
              Master codes for all rooms in {getPropertyName(propertyId)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="text-center py-8">Loading rooms...</div>
            ) : propertyRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rooms found for this property.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Room ID</TableHead>
                    <TableHead>Master Code</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Assigned Door Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyRooms
                    .sort((a, b) => a.roomNumber - b.roomNumber)
                    .map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          Room {room.roomNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {room.id}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {room.masterCode || '1234'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            room.status === 'available' ? 'bg-green-100 text-green-800' :
                            room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                            room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {room.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {room.doorCode ? (
                            <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                              {room.doorCode}
                            </span>
                          ) : (
                            <span className="text-gray-400">No guest code</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(room)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Master Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Master Code</DialogTitle>
            <DialogDescription>
              Update the master code for {selectedRoom?.id} (Room {selectedRoom?.roomNumber})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="masterCode">Master Code *</Label>
              <Input
                id="masterCode"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="Enter 4-digit code"
                maxLength={4}
                pattern="\d{4}"
                className="font-mono"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This code is separate from guest door codes
              </p>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMasterCodeMutation.isPending}
              >
                {updateMasterCodeMutation.isPending ? 'Updating...' : 'Update Master Code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
