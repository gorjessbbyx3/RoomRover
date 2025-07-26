import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import { RoomWithDetails } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { 
  Key, 
  Edit, 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Rooms() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeDuration, setCodeDuration] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);

  const { data: rooms, isLoading } = useQuery<RoomWithDetails[]>({
    queryKey: ['/api/rooms'],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async ({ roomId, duration }: { roomId: string; duration: string }) => {
      const response = await apiRequest('POST', `/api/rooms/${roomId}/generate-code`, { duration });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Door Code Generated',
        description: `New code ${data.doorCode} generated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setCodeDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate door code',
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, updates }: { roomId: string; updates: Partial<RoomWithDetails> }) => {
      const response = await apiRequest('PUT', `/api/rooms/${roomId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Room Updated',
        description: 'Room status updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update room',
      });
    },
  });

  const handleGenerateCode = () => {
    if (!selectedRoom) return;

    generateCodeMutation.mutate({
      roomId: selectedRoom.id,
      duration: codeDuration
    });
  };

  const handleStatusChange = (roomId: string, newStatus: string) => {
    updateRoomMutation.mutate({
      roomId,
      updates: { status: newStatus }
    });
  };

  const isCodeExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Simulate search delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      // The filtering happens in filteredRooms below
    } finally {
      setIsSearching(false);
    }
  };

  const filteredRooms = rooms?.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Show empty state when search returns no results
  const showEmptyState = searchTerm && filteredRooms.length === 0;

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Room Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage room status, door codes, and maintenance for {user.property || 'all properties'}.
        </p>
      </div>

      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">
              Room Status Overview
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage room status, codes, and cleaning
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="flex gap-2 max-w-sm">
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                variant="outline"
                size="sm"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <Button 
              className="bg-primary-500 hover:bg-primary-600"
              data-testid="button-bulk-generate-codes"
            >
              <Key className="h-4 w-4 mr-2" />
              Bulk Generate Codes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Door Code</TableHead>
                    <TableHead>Code Expiry</TableHead>
                    <TableHead>Cleaning Status</TableHead>
                    <TableHead>Last Cleaned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms?.map((room) => (
                    <TableRow key={room.id} className="hover:bg-gray-50" data-testid={`room-row-${room.id}`}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{room.id}</div>
                          <div className="text-sm text-gray-500">Room {room.roomNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={room.status} type="room" />
                      </TableCell>
                      <TableCell>
                        {room.doorCode ? (
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={isCodeExpired(room.codeExpiry) ? "destructive" : "default"}
                              className="font-mono"
                            >
                              {room.doorCode}
                            </Badge>
                            {isCodeExpired(room.codeExpiry) && (
                              <AlertCircle className="h-4 w-4 text-error-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No code</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={isCodeExpired(room.codeExpiry) ? 'text-error-600' : 'text-gray-600'}>
                          {formatDate(room.codeExpiry)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={room.cleaningStatus} type="cleaning" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(room.lastCleaned)}</div>
                          <div className="text-xs text-gray-500">Linen: {formatDate(room.lastLinenChange)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRoom(room);
                              setCodeDialogOpen(true);
                            }}
                            className="text-warning-600 hover:text-warning-800"
                            data-testid={`button-generate-code-${room.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          <Select
                            value={room.status}
                            onValueChange={(value) => handleStatusChange(room.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success-600 hover:text-success-800"
                            data-testid={`button-message-${room.id}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {showEmptyState ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rooms found matching "{searchTerm}"</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              null
            ))}
          </div>
        )}

      {/* Generate Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent data-testid="dialog-generate-code">
          <DialogHeader>
            <DialogTitle>Generate Door Code</DialogTitle>
            <p className="text-sm text-gray-500">Generate a new door access code for the selected room.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room</Label>
              <Input 
                value={selectedRoom?.id || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="duration">Code Duration</Label>
              <Select value={codeDuration} onValueChange={setCodeDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (2 days)</SelectItem>
                  <SelectItem value="weekly">Weekly (10 days)</SelectItem>
                  <SelectItem value="monthly">Monthly (35 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCodeDialogOpen(false)}
                data-testid="button-cancel-generate-code"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateCode}
                disabled={generateCodeMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
                data-testid="button-confirm-generate-code"
              >
                {generateCodeMutation.isPending ? 'Generating...' : 'Generate Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}