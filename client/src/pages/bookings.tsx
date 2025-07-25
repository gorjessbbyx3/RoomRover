import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import { useAuth } from '@/lib/auth';
import { 
  Plus, 
  Calendar, 
  User, 
  DollarSign,
  Clock,
  Edit,
  Eye
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

interface Room {
  id: string;
  propertyId: string;
  roomNumber: number;
  status: string;
}

interface Property {
  id: string;
  name: string;
  rateDaily: string;
  rateWeekly: string;
  rateMonthly: string;
}

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room is required'),
  guestId: z.string().min(1, 'Guest is required'),
  plan: z.string().min(1, 'Plan is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  totalAmount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
  isTenant: z.boolean().optional(),
}).refine((data) => {
  // If not a tenant, end date is required
  if (!data.isTenant && (!data.endDate || data.endDate.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "End date is required for non-tenant bookings",
  path: ["endDate"],
});

const guestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().min(1, 'Contact is required'),
  contactType: z.enum(['phone', 'email']),
  referralSource: z.string().optional(),
  cashAppTag: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;
type GuestFormData = z.infer<typeof guestSchema>;

export default function Bookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ['/api/guests'],
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const bookingForm = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: '',
      guestId: '',
      plan: 'monthly',
      startDate: '',
      endDate: '',
      totalAmount: '',
      notes: '',
      isTenant: false,
    },
  });

  const guestForm = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: '',
      contact: '',
      contactType: 'phone',
      referralSource: '',
      cashAppTag: '',
      notes: '',
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const bookingData = {
        ...data,
        // Set end date to null for tenant bookings, or far future date
        endDate: data.isTenant ? null : data.endDate,
        isTenant: data.isTenant || false
      };
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
      setBookingDialogOpen(false);
      bookingForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create booking',
      });
    },
  });

  const createGuestMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      const response = await apiRequest('POST', '/api/guests', data);
      return response.json();
    },
    onSuccess: (newGuest) => {
      toast({
        title: 'Guest Created',
        description: 'New guest created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guests'] });
      setGuestDialogOpen(false);
      guestForm.reset();
      // Auto-select the new guest in booking form
      bookingForm.setValue('guestId', newGuest.id);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create guest',
      });
    },
  });

  const calculateAmount = (plan: string, roomId: string) => {
    const room = rooms?.find(r => r.id === roomId);
    const property = properties?.find(p => p.id === room?.propertyId);
    
    if (!property) return '';

    switch (plan) {
      case 'daily':
        return property.rateDaily;
      case 'weekly':
        return property.rateWeekly;
      case 'monthly':
        return property.rateMonthly;
      default:
        return '';
    }
  };

  const handlePlanOrRoomChange = () => {
    const roomId = bookingForm.getValues('roomId');
    const plan = bookingForm.getValues('plan');
    
    if (roomId && plan) {
      const amount = calculateAmount(plan, roomId);
      bookingForm.setValue('totalAmount', amount);
    }
  };

  const onSubmitBooking = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const onSubmitGuest = (data: GuestFormData) => {
    createGuestMutation.mutate(data);
  };

  const formatCurrency = (amount: string) => `$${parseFloat(amount).toFixed(0)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const availableRooms = rooms?.filter(room => room.status === 'available') || [];

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Booking Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage reservations and guest bookings for {user.property || 'all properties'}.
        </p>
      </div>

      <Card className="shadow-material mb-6">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">
              Active Bookings
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage guest reservations and membership plans
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-guest">
                  <User className="h-4 w-4 mr-2" />
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-add-guest">
                <DialogHeader>
                  <DialogTitle>Add New Guest</DialogTitle>
                </DialogHeader>
                <Form {...guestForm}>
                  <form onSubmit={guestForm.handleSubmit(onSubmitGuest)} className="space-y-4">
                    <FormField
                      control={guestForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter guest's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={guestForm.control}
                        name="contact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact *</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone or email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guestForm.control}
                        name="contactType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={guestForm.control}
                        name="referralSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Source</FormLabel>
                            <FormControl>
                              <Input placeholder="How did they hear about us?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guestForm.control}
                        name="cashAppTag"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cash App Tag</FormLabel>
                            <FormControl>
                              <Input placeholder="$cashtag" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={guestForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional information..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setGuestDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createGuestMutation.isPending}
                        className="bg-success-500 hover:bg-success-600"
                      >
                        {createGuestMutation.isPending ? 'Creating...' : 'Create Guest'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-500 hover:bg-primary-600" data-testid="button-new-booking">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-new-booking">
                <DialogHeader>
                  <DialogTitle>Create New Booking</DialogTitle>
                </DialogHeader>
                <Form {...bookingForm}>
                  <form onSubmit={bookingForm.handleSubmit(onSubmitBooking)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bookingForm.control}
                        name="roomId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handlePlanOrRoomChange();
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select room" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableRooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.id} (Room {room.roomNumber})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bookingForm.control}
                        name="guestId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guest *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select guest" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {guests?.map((guest) => (
                                  <SelectItem key={guest.id} value={guest.id}>
                                    {guest.name} ({guest.contact})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={bookingForm.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Plan *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePlanOrRoomChange();
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly Membership (Recommended)</SelectItem>
                              <SelectItem value="weekly">Weekly Residency</SelectItem>
                              <SelectItem value="daily">Daily Access</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bookingForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bookingForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              End Date {!bookingForm.watch('isTenant') && '*'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                disabled={bookingForm.watch('isTenant')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={bookingForm.control}
                      name="isTenant"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                if (e.target.checked) {
                                  bookingForm.setValue('endDate', '');
                                }
                              }}
                              className="mt-2"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Tenant Booking
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Check this box for indefinite tenant bookings (no end date required)
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional booking information..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setBookingDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createBookingMutation.isPending}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {bookingsLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const guest = guests?.find(g => g.id === booking.guestId);
                    
                    return (
                      <TableRow key={booking.id} className="hover:bg-gray-50" data-testid={`booking-row-${booking.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{guest?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{guest?.contact}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.roomId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="capitalize">{booking.plan}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(booking.startDate)}</div>
                            <div className="text-gray-500">
                              {booking.endDate ? `to ${formatDate(booking.endDate)}` : 'Tenant (No end date)'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.paymentStatus} type="payment" />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} type="booking" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedBooking(booking)}
                              className="text-primary-600 hover:text-primary-800"
                              data-testid={`button-view-booking-${booking.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-warning-600 hover:text-warning-800"
                              data-testid={`button-edit-booking-${booking.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first booking.</p>
              <Button 
                onClick={() => setBookingDialogOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
