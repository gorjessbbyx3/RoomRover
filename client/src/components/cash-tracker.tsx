
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, HandCoins, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { CashTurnIn } from '@/lib/types';

export default function CashTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [turnInAmount, setTurnInAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Get today's cash payments for this manager
  const { data: payments } = useQuery({
    queryKey: ['/api/payments/detailed'],
    queryFn: async () => {
      const response = await fetch('/api/payments/detailed', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    }
  });

  // Get cash turn-ins for this manager
  const { data: turnIns, isLoading: turnInsLoading } = useQuery<CashTurnIn[]>({
    queryKey: ['/api/cash-turnins'],
    queryFn: async () => {
      const response = await fetch('/api/cash-turnins', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch turn-ins');
      return response.json();
    }
  });

  const turnInMutation = useMutation({
    mutationFn: async (data: { amount: number; notes?: string }) => {
      const response = await fetch('/api/cash-turnins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to record turn-in');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-turnins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsDialogOpen(false);
      setTurnInAmount('');
      setNotes('');
      toast({
        title: 'Cash Turn-in Recorded',
        description: 'Your cash turn-in has been successfully logged.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record cash turn-in.',
        variant: 'destructive',
      });
    }
  });

  if (!user || user.role !== 'manager') return null;

  // Calculate today's cash metrics
  const today = new Date().toDateString();
  const todayCashPayments = payments?.filter(p => 
    p.receivedBy === user.id && 
    p.method === 'cash' && 
    new Date(p.dateReceived).toDateString() === today
  ) || [];

  const todayTotalCash = todayCashPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const todayTurnIns = turnIns?.filter(t => 
    new Date(t.turnInDate).toDateString() === today
  ) || [];

  const todayTurnInTotal = todayTurnIns.reduce((sum, t) => sum + t.amount, 0);
  const currentCashHolding = Math.max(0, todayTotalCash - todayTurnInTotal);

  const lastTurnIn = turnIns?.sort((a, b) => 
    new Date(b.turnInDate).getTime() - new Date(a.turnInDate).getTime()
  )[0];

  const handleTurnIn = () => {
    const amount = parseFloat(turnInAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > currentCashHolding) {
      toast({
        title: 'Amount Too High',
        description: `You can only turn in up to $${currentCashHolding.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    turnInMutation.mutate({ amount, notes });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDateTime = (date: string | Date) => new Date(date).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Cash Holdings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash Collected Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(todayTotalCash)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {todayCashPayments.length} payment{todayCashPayments.length !== 1 ? 's' : ''}
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
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <HandCoins className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Cash Holding</dt>
                  <dd className={`text-lg font-medium ${currentCashHolding > 200 ? 'text-warning-600' : 'text-gray-900'}`}>
                    {formatCurrency(currentCashHolding)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {currentCashHolding > 200 ? 'Consider turning in cash' : 'Within normal range'}
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
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Last Turn-in</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lastTurnIn ? formatCurrency(lastTurnIn.amount) : 'None'}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {lastTurnIn ? formatDateTime(lastTurnIn.turnInDate) : 'No turn-ins yet'}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turn-in Actions */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Cash Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Turn in cash when you have collected significant amounts
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-success-500 hover:bg-success-600"
                  disabled={currentCashHolding <= 0}
                >
                  <HandCoins className="h-4 w-4 mr-2" />
                  Turn In Cash
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Turn In Cash</DialogTitle>
                  <DialogDescription>
                    Record the amount of cash you're turning in. Current holding: {formatCurrency(currentCashHolding)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      max={currentCashHolding}
                      value={turnInAmount}
                      onChange={(e) => setTurnInAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes about this turn-in..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTurnIn}
                    disabled={turnInMutation.isPending}
                  >
                    {turnInMutation.isPending ? 'Recording...' : 'Record Turn-in'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Today's Turn-ins */}
          {todayTurnIns.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Today's Turn-ins</h4>
              {todayTurnIns.map((turnIn) => (
                <div key={turnIn.id} className="flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-3" />
                    <div>
                      <div className="font-medium text-success-800">
                        {formatCurrency(turnIn.amount)} turned in
                      </div>
                      <div className="text-sm text-success-600">
                        {formatDateTime(turnIn.turnInDate)}
                      </div>
                      {turnIn.notes && (
                        <div className="text-xs text-gray-600 mt-1">
                          {turnIn.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Total turned in today: <span className="font-medium">{formatCurrency(todayTurnInTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HandCoins className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No cash turn-ins recorded today</p>
              <p className="text-sm mt-1">Turn in cash when you've collected significant amounts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Collection History */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Today's Cash Collections</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {todayCashPayments.length > 0 ? (
            <div className="space-y-3">
              {todayCashPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(parseFloat(payment.amount))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Booking: {payment.bookingId.slice(-8)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(payment.dateReceived)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">Cash</div>
                    {payment.notes && (
                      <div className="text-xs text-gray-500 mt-1">
                        {payment.notes.slice(0, 30)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No cash payments collected today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
