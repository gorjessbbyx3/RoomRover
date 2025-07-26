import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import { RoomWithDetails } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { 
  Key, 
  Edit, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Plus,
  FileText
} from 'lucide-react';

interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  plan: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  paymentStatus: string;
  status: string;
  doorCode: string | null;
  frontDoorCode: string | null;
  codeExpiry: string | null;
  notes: string | null;
  createdAt: string;
}

interface Guest {
  id: string;
  name: string;
  contact: string;
  contactType: string;
  referralSource: string | null;
  cashAppTag: string | null;
}

export default function InHouse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [newMemberDialogOpen, setNewMemberDialogOpen] = useState(false);
  const [codeDuration, setCodeDuration] = useState('monthly');
  const [roomNotes, setRoomNotes] = useState('');

  // New Member Form State
  const [newMember, setNewMember] = useState({
    name: '',
    contact: '',
    contactType: 'phone',
    referralSource: '',
    cashAppTag: ''
  });

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    guestId: '',
    roomId: '',
    plan: 'daily',
    startDate: '',
    endDate: '',
    totalAmount: ''
  });

  const { data: rooms, isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useQuery<RoomWithDetails[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 5000 // Consider data stale after 5 seconds
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ['/api/guests'],
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
        description: 'Room updated successfully.',
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

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: typeof newMember) => {
      const response = await apiRequest('POST', '/api/guests', memberData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Member Created',
        description: 'New member created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guests'] });
      setNewMemberDialogOpen(false);
      setNewMember({
        name: '',
        contact: '',
        contactType: 'phone',
        referralSource: '',
        cashAppTag: ''
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create member',
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: typeof newBooking) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking Created',
        description: 'New booking created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setNewBookingDialogOpen(false);
      setNewBooking({
        guestId: '',
        roomId: '',
        plan: 'daily',
        startDate: '',
        endDate: '',
        totalAmount: ''
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create booking',
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

  const handleSaveNotes = () => {
    if (!selectedRoom) return;

    updateRoomMutation.mutate({
      roomId: selectedRoom.id,
      updates: { notes: roomNotes }
    });
    setNotesDialogOpen(false);
  };

  const handleCreateMember = () => {
    if (!newMember.name || !newMember.contact) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name and contact are required.',
      });
      return;
    }

    createMemberMutation.mutate(newMember);
  };

  const handleCreateBooking = () => {
    if (!newBooking.guestId || !newBooking.roomId || !newBooking.startDate || !newBooking.totalAmount) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All fields are required.',
      });
      return;
    }

    createBookingMutation.mutate(newBooking);
  };

  const isCodeExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string) => `$${parseFloat(amount).toFixed(0)}`;

  const getGuestForRoom = (roomId: string) => {
    const booking = bookings?.find(b => b.roomId === roomId && b.status === 'active');
    if (!booking) return null;
    return guests?.find(g => g.id === booking.guestId);
  };

  const getBookingForRoom = (roomId: string) => {
    return bookings?.find(b => b.roomId === roomId && b.status === 'active');
  };

  if (!user) return null;

  const isLoading = roomsLoading || bookingsLoading || guestsLoading;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          InHouse Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage room status, member assignments, and door codes for {user.property || 'all properties'}.
        </p>
      </div>

      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">
              Room & Member Overview
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage room assignments, member information, and access codes
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setNewBookingDialogOpen(true)}
              className="bg-success-500 hover:bg-success-600"
              data-testid="button-new-booking"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
            <Button 
              onClick={() => setNewMemberDialogOpen(true)}
              className="bg-primary-500 hover:bg-primary-600"
              data-testid="button-new-member"
            >
              <User className="h-4 w-4 mr-2" />
              New Member
            </Button>
            <Button 
              onClick={() => window.location.href = '/master-codes-management'}
              className="bg-warning-500 hover:bg-warning-600"
              data-testid="button-master-codes"
            >
              <Key className="h-4 w-4 mr-2" />
              Master Codes
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
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Door Code</TableHead>
                    <TableHead>Last Cleaned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms?.map((room) => {
                    const guest = getGuestForRoom(room.id);
                    const booking = getBookingForRoom(room.id);

                    return (
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
                          {guest ? (
                            <button
                              onClick={() => {
                                setSelectedGuest(guest);
                                setGuestDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              <div className="font-medium">{guest.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{booking?.plan} plan</div>
                            </button>
                          ) : (
                            <span className="text-gray-400">Vacant</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest ? (
                            <div className="text-sm text-gray-600">{guest.contact}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {room.doorCode ? (
                            <Badge 
                              variant="default"
                              className="font-mono"
                            >
                              {room.doorCode}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">No code</span>
                          )}
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
                              onClick={() => {
                                setSelectedRoom(room);
                                setRoomNotes(room.notes || '');
                                setNotesDialogOpen(true);
                              }}
                              className="text-gray-600 hover:text-gray-800"
                              data-testid={`button-notes-${room.id}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Guest Information Dialog */}
      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent data-testid="dialog-guest-info">
          <DialogHeader>
            <DialogTitle>Member Information</DialogTitle>
            <p className="text-sm text-gray-500">View member details and intake information.</p>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <p className="text-sm text-gray-900">{selectedGuest.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Contact</Label>
                  <p className="text-sm text-gray-900">{selectedGuest.contact}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Contact Type</Label>
                  <p className="text-sm text-gray-900 capitalize">{selectedGuest.contactType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Cash App Tag</Label>
                  <p className="text-sm text-gray-900">{selectedGuest.cashAppTag || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Referral Source</Label>
                <p className="text-sm text-gray-900">{selectedGuest.referralSource || 'Not provided'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setGuestDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent data-testid="dialog-staff-notes">
          <DialogHeader>
            <DialogTitle>Staff Notes</DialogTitle>
            <p className="text-sm text-gray-500">Add or edit internal staff notes for this room.</p>
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
              <Label htmlFor="room-notes">Internal Notes (Staff Only)</Label>
              <Textarea
                id="room-notes"
                value={roomNotes}
                onChange={(e) => setRoomNotes(e.target.value)}
                placeholder="Add internal notes about this room, member, or any issues..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes}
              disabled={updateRoomMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {updateRoomMutation.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Member Dialog */}
      <Dialog open={newMemberDialogOpen} onOpenChange={setNewMemberDialogOpen}>
        <DialogContent data-testid="dialog-new-member">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <p className="text-sm text-gray-500">Create a new member profile.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member-name">Full Name *</Label>
                <Input
                  id="member-name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="member-contact">Contact *</Label>
                <Input
                  id="member-contact"
                  value={newMember.contact}
                  onChange={(e) => setNewMember({...newMember, contact: e.target.value})}
                  placeholder="Phone or email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-type">Contact Type</Label>
                <Select value={newMember.contactType} onValueChange={(value) => setNewMember({...newMember, contactType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cash-app-tag">Cash App Tag</Label>
                <Input
                  id="cash-app-tag"
                  value={newMember.cashAppTag}
                  onChange={(e) => setNewMember({...newMember, cashAppTag: e.target.value})}
                  placeholder="$username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="referral-source">Referral Source</Label>
              <Input
                id="referral-source"
                value={newMember.referralSource}
                onChange={(e) => setNewMember({...newMember, referralSource: e.target.value})}
                placeholder="How did they hear about us?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMember}
              disabled={createMemberMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {createMemberMutation.isPending ? 'Creating...' : 'Create Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Booking Dialog */}
      <Dialog open={newBookingDialogOpen} onOpenChange={setNewBookingDialogOpen}>
        <DialogContent data-testid="dialog-new-booking">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <p className="text-sm text-gray-500">Create a new booking for a member.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking-guest">Member *</Label>
                <Select value={newBooking.guestId} onValueChange={(value) => setNewBooking({...newBooking, guestId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {guests?.filter(guest => guest.id && guest.id.trim() !== '').map((guest) => (
                      <SelectItem key={guest.id} value={guest.id}>
                        {guest.name} - {guest.contact}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="booking-room">Room *</Label>
                <Select value={newBooking.roomId} onValueChange={(value) => setNewBooking({...newBooking, roomId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.filter(room => room.status === 'available' && room.id && room.id.trim() !== '').map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber} ({room.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking-plan">Plan *</Label>
                <Select value={newBooking.plan} onValueChange={(value) => setNewBooking({...newBooking, plan: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="booking-amount">Total Amount *</Label>
                <Input
                  id="booking-amount"
                  type="number"
                  value={newBooking.totalAmount}
                  onChange={(e) => setNewBooking({...newBooking, totalAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking-start">Start Date *</Label>
                <Input
                  id="booking-start"
                  type="date"
                  value={newBooking.startDate}
                  onChange={(e) => setNewBooking({...newBooking, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="booking-end">End Date</Label>
                <Input
                  id="booking-end"
                  type="date"
                  value={newBooking.endDate}
                  onChange={(e) => setNewBooking({...newBooking, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewBookingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBooking}
              disabled={createBookingMutation.isPending}
              className="bg-success-500 hover:bg-success-600"
            >
              {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}