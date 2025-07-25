import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, Receipt, CreditCard, Banknote, Clock } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CashTracker from '@/components/cash-tracker';
import { 
  Calendar,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';


interface Payment {
  id: string;
  bookingId: string;
  amount: string;
  method: string;
  transactionId: string | null;
  dateReceived: string;
  receivedBy: string;
  notes: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  plan: string;
  totalAmount: string;
  paymentStatus: string;
  status: string;
}

interface Guest {
  id: string;
  name: string;
  contact: string;
  cashAppTag: string | null;
}

const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  amount: z.string().min(1, 'Amount is required'),
  method: z.enum(['cash', 'cash_app'], {
    required_error: 'Payment method is required',
  }),
  transactionId: z.string().optional(),
  dateReceived: z.string().min(1, 'Date received is required'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/detailed'],
    queryFn: async () => {
      const response = await fetch('/api/payments/detailed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    }
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ['/api/guests'],
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bookingId: '',
      amount: '',
      method: 'cash',
      transactionId: '',
      dateReceived: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest('POST', '/api/payments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/detailed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Payment Recorded',
        description: 'Payment has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setPaymentDialogOpen(false);
      paymentForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to record payment',
      });
    },
  });

  const onSubmitPayment = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleBookingChange = (bookingId: string) => {
    const booking = bookings?.find(b => b.id === bookingId);
    if (booking) {
      paymentForm.setValue('amount', booking.totalAmount);
    }
  };

  const formatCurrency = (amount: string) => `$${parseFloat(amount).toFixed(0)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString();

  // Calculate stats
  const totalRevenue = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  const todayPayments = payments?.filter(payment => {
    const today = new Date().toDateString();
    return new Date(payment.dateReceived).toDateString() === today;
  }) || [];
  const todayRevenue = todayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const cashPayments = payments?.filter(p => p.method === 'cash') || [];
  const cashAppPayments = payments?.filter(p => p.method === 'cash_app') || [];

  // Get pending payments (unpaid bookings)
  const pendingPayments = bookings?.filter(booking => booking.paymentStatus === 'pending') || [];

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Payment Management
        </h1>
        <p className="text-gray-600 mt-2">
          Track cash and Cash App payments for {user.property || 'all properties'}.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-total-revenue">
                    {paymentsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(totalRevenue.toString())}
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
                  <DollarSign className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-today-revenue">
                    {paymentsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(todayRevenue.toString())}
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
                  <Banknote className="h-4 w-4 text-warning-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash Payments</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-cash-payments">
                    {paymentsLoading ? <Skeleton className="h-6 w-8" /> : cashPayments.length}
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
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash App Payments</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-cashapp-payments">
                    {paymentsLoading ? <Skeleton className="h-6 w-8" /> : cashAppPayments.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Payments */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900">
              Pending Payments
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Bookings awaiting payment
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.slice(0, 5).map((booking) => {
                  const guest = guests?.find(g => g.id === booking.guestId);

                  return (
                    <div 
                      key={booking.id}
                      className="border border-warning-200 rounded-lg p-3 bg-warning-50"
                      data-testid={`pending-payment-${booking.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-warning-800">{guest?.name || 'Unknown'}</h4>
                          <div className="text-sm text-warning-600">{booking.roomId}</div>
                          <div className="text-sm font-medium text-warning-800">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            paymentForm.setValue('bookingId', booking.id);
                            paymentForm.setValue('amount', booking.totalAmount);
                            setPaymentDialogOpen(true);
                          }}
                          className="bg-warning-500 hover:bg-warning-600 text-white"
                          data-testid={`button-record-payment-${booking.id}`}
                        >
                          Record
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending payments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="shadow-material lg:col-span-2">
          <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                Recent Payments
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Latest payment transactions
              </p>
            </div>
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-success-500 hover:bg-success-600" data-testid="button-record-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-record-payment">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleBookingChange(value);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select booking" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bookings?.filter(b => b.paymentStatus === 'pending').map((booking) => {
                                const guest = guests?.find(g => g.id === booking.guestId);
                                return (
                                  <SelectItem key={booking.id} value={booking.id}>
                                    {guest?.name} - {booking.roomId} ({formatCurrency(booking.totalAmount)})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount *</FormLabel>
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
                        control={paymentForm.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="cash_app">Cash App</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="transactionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="For Cash App payments" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="dateReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Received *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={paymentForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional payment details..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setPaymentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPaymentMutation.isPending}
                        className="bg-success-500 hover:bg-success-600"
                      >
                        {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-6">
            {paymentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 8).map((payment) => {
                  const booking = bookings?.find(b => b.id === payment.bookingId);
                  const guest = guests?.find(g => g.id === booking?.guestId);

                  return (
                    <div 
                      key={payment.id}
                      className="border border-success-200 rounded-lg p-3 bg-success-50"
                      data-testid={`payment-${payment.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-success-800">{guest?.name || 'Unknown'}</h4>
                            <Badge 
                              variant={payment.method === 'cash' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {payment.method === 'cash' ? 'Cash' : 'Cash App'}
                            </Badge>
                          </div>
                          <div className="text-sm text-success-600">
                            {booking?.roomId} • {formatDate(payment.dateReceived)}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-success-600 font-mono">
                              ID: {payment.transactionId}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success-800">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="text-xs text-success-600">
                            {formatDateTime(payment.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payments recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">
            Payment History
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Complete payment transaction history
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date Received</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const booking = bookings?.find(b => b.id === payment.bookingId);
                    const guest = guests?.find(g => g.id === booking?.guestId);

                    return (
                      <TableRow key={payment.id} className="hover:bg-gray-50" data-testid={`payment-row-${payment.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{guest?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{guest?.contact}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking?.roomId}</div>
                            <div className="text-sm text-gray-500 capitalize">{booking?.plan}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.method === 'cash' ? 'secondary' : 'default'}
                            className="capitalize"
                          >
                            {payment.method === 'cash' ? 'Cash' : 'Cash App'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.transactionId ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {payment.transactionId}
                            </code>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(payment.dateReceived)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">Staff</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
              <p className="text-gray-500 mb-6">Start recording payments to see them here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}