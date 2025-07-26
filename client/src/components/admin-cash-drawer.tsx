
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, HandCoins, TrendingUp, Clock, CheckCircle, AlertTriangle, CreditCard, Banknote, Building2 } from 'lucide-react';
import { AdminDrawerStats, AdminCashDrawer } from '@/lib/types';

export default function AdminCashDrawerComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositType, setDepositType] = useState<'bank_deposit_cash' | 'bank_deposit_cashapp'>('bank_deposit_cash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  // Get admin drawer stats
  const { data: drawerStats, isLoading: statsLoading } = useQuery<AdminDrawerStats>({
    queryKey: ['/api/admin/cash-drawer/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cash-drawer/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch admin drawer stats');
      return response.json();
    }
  });

  // Get admin drawer transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<AdminCashDrawer[]>({
    queryKey: ['/api/admin/cash-drawer'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cash-drawer', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch admin drawer transactions');
      return response.json();
    }
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; amount: number; description: string }) => {
      const response = await fetch('/api/admin/bank-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record deposit');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cash-drawer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cash-drawer/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setDepositDialogOpen(false);
      setDepositAmount('');
      setDepositDescription('');
      toast({
        title: 'Bank Deposit Recorded',
        description: 'Your bank deposit has been successfully logged.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record bank deposit.',
        variant: 'destructive',
      });
    }
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    const maxAmount = depositType === 'bank_deposit_cash' 
      ? drawerStats?.currentCashHolding || 0
      : drawerStats?.currentCashAppHolding || 0;

    if (amount > maxAmount) {
      toast({
        title: 'Amount Too High',
        description: `You can only deposit up to $${maxAmount.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    depositMutation.mutate({ 
      type: depositType, 
      amount, 
      description: depositDescription || `Bank deposit - ${depositType === 'bank_deposit_cash' ? 'Cash' : 'Cash App'}`
    });
  };

  if (!user || user.role !== 'admin') return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDateTime = (date: string | Date) => new Date(date).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Admin Cash Holdings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-material border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash on Hand</dt>
                  <dd className={`text-lg font-medium ${(drawerStats?.currentCashHolding || 0) > 1000 ? 'text-warning-600' : 'text-gray-900'}`}>
                    {statsLoading ? '...' : formatCurrency(drawerStats?.currentCashHolding || 0)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    From manager turn-ins
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash App Balance</dt>
                  <dd className={`text-lg font-medium ${(drawerStats?.currentCashAppHolding || 0) > 1000 ? 'text-warning-600' : 'text-gray-900'}`}>
                    {statsLoading ? '...' : formatCurrency(drawerStats?.currentCashAppHolding || 0)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    From customer payments
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash Deposited</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : formatCurrency(drawerStats?.totalCashDeposited || 0)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    Total bank deposits
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cash App Deposited</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : formatCurrency(drawerStats?.totalCashAppDeposited || 0)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    Total transfers to bank
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Actions */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Bank Deposit Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Record when you deposit cash or transfer Cash App funds to the bank
              </p>
            </div>
            <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600"
                  disabled={!drawerStats || (drawerStats.currentCashHolding <= 0 && drawerStats.currentCashAppHolding <= 0)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Record Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Bank Deposit</DialogTitle>
                  <DialogDescription>
                    Record a cash deposit or Cash App transfer to the bank
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="depositType">Deposit Type *</Label>
                    <Select value={depositType} onValueChange={(value: any) => setDepositType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_deposit_cash">
                          Cash Deposit (Available: {formatCurrency(drawerStats?.currentCashHolding || 0)})
                        </SelectItem>
                        <SelectItem value="bank_deposit_cashapp">
                          Cash App Transfer (Available: {formatCurrency(drawerStats?.currentCashAppHolding || 0)})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      max={depositType === 'bank_deposit_cash' ? drawerStats?.currentCashHolding : drawerStats?.currentCashAppHolding}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={depositDescription}
                      onChange={(e) => setDepositDescription(e.target.value)}
                      placeholder="Any additional notes about this deposit..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeposit}
                    disabled={depositMutation.isPending}
                  >
                    {depositMutation.isPending ? 'Recording...' : 'Record Deposit'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Alerts for high balances */}
          {drawerStats && (drawerStats.currentCashHolding > 1000 || drawerStats.currentCashAppHolding > 1000) && (
            <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-warning-500 mr-3" />
                <div>
                  <div className="font-medium text-warning-800">High Balance Alert</div>
                  <div className="text-sm text-warning-600">
                    Consider making a bank deposit to secure funds
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Deposits Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Last Cash Deposit</h4>
              {drawerStats?.lastCashDeposit ? (
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(drawerStats.lastCashDeposit.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(drawerStats.lastCashDeposit.date)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No deposits yet</div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Last Cash App Transfer</h4>
              {drawerStats?.lastCashAppDeposit ? (
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {formatCurrency(drawerStats.lastCashAppDeposit.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(drawerStats.lastCashAppDeposit.date)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No transfers yet</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions
                .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                .slice(0, 10)
                .map((transaction) => (
                  <div key={transaction.id} className={`p-3 rounded-lg border ${
                    transaction.type.includes('received') 
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {transaction.type.includes('cash') ? (
                          <Banknote className="h-5 w-5 text-green-500 mr-3" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-purple-500 mr-3" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            {transaction.source && `From: ${transaction.source} • `}
                            {formatDateTime(transaction.transactionDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          transaction.type.includes('received') ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {transaction.type.includes('received') ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {transaction.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No transactions recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
