
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Building2, DollarSign, TrendingDown, TrendingUp, Package, Users, Wrench, Zap, MoreHorizontal, Receipt, ArrowUpDown } from 'lucide-react';
import { HouseBankStats, HouseBankTransaction } from '@/lib/types';

export default function HouseBankManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'supplies' | 'contractors' | 'maintenance' | 'utilities' | 'other'>('supplies');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const { data: houseBankStats, isLoading: statsLoading } = useQuery<HouseBankStats>({
    queryKey: ['/api/admin/house-bank/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/house-bank/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch house bank stats');
      return response.json();
    }
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<HouseBankTransaction[]>({
    queryKey: ['/api/admin/house-bank'],
    queryFn: async () => {
      const response = await fetch('/api/admin/house-bank', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch house bank transactions');
      return response.json();
    }
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string }) => {
      const response = await fetch('/api/admin/house-bank/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer funds');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/house-bank/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/house-bank'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cash-drawer/stats'] });
      setTransferDialogOpen(false);
      setTransferAmount('');
      setTransferDescription('');
      toast({
        title: 'Transfer Successful',
        description: 'Funds transferred to HouseBank successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Transfer Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const expenseMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      category: string;
      vendor?: string;
      description: string;
      receiptUrl?: string;
    }) => {
      const response = await fetch('/api/admin/house-bank/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record expense');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/house-bank/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/house-bank'] });
      setExpenseDialogOpen(false);
      setExpenseAmount('');
      setExpenseVendor('');
      setExpenseDescription('');
      setReceiptUrl('');
      toast({
        title: 'Expense Recorded',
        description: 'Expense has been recorded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Record Expense',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    transferMutation.mutate({
      amount,
      description: transferDescription || 'Transfer to HouseBank for operational expenses'
    });
  };

  const handleExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!expenseDescription.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please provide a description for the expense.',
        variant: 'destructive',
      });
      return;
    }

    expenseMutation.mutate({
      amount,
      category: expenseCategory,
      vendor: expenseVendor || undefined,
      description: expenseDescription,
      receiptUrl: receiptUrl || undefined
    });
  };

  if (!user || user.role !== 'admin') return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDateTime = (date: string | Date) => new Date(date).toLocaleString();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'supplies': return <Package className="h-4 w-4" />;
      case 'contractors': return <Users className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'utilities': return <Zap className="h-4 w-4" />;
      default: return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'supplies': return 'text-blue-600 bg-blue-100';
      case 'contractors': return 'text-purple-600 bg-purple-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      case 'utilities': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* HouseBank Overview */}
      <Card className="shadow-material bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader className="border-b border-blue-200">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            HouseBank - Operational Budget
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Dedicated budget for supplies, contractors, and operational expenses
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Current Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(houseBankStats?.currentBalance || 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Total Transfers In</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(houseBankStats?.totalTransfersIn || 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Total Expenses</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(houseBankStats?.totalExpenses || 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Available Budget</div>
                  <div className={`text-xl font-bold ${
                    (houseBankStats?.currentBalance || 0) > 500 ? 'text-green-600' : 
                    (houseBankStats?.currentBalance || 0) > 200 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(houseBankStats?.currentBalance || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Transfer Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Funds to HouseBank</DialogTitle>
                  <DialogDescription>
                    Transfer funds from your cash drawer to the HouseBank for operational expenses.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="transfer-amount">Amount ($)</Label>
                    <Input
                      id="transfer-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transfer-description">Description</Label>
                    <Textarea
                      id="transfer-description"
                      value={transferDescription}
                      onChange={(e) => setTransferDescription(e.target.value)}
                      placeholder="Purpose of transfer..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTransfer}
                    disabled={transferMutation.isPending}
                  >
                    {transferMutation.isPending ? 'Processing...' : 'Transfer Funds'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Record Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record HouseBank Expense</DialogTitle>
                  <DialogDescription>
                    Record an expense from the HouseBank for operational costs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense-amount">Amount ($)</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-category">Category</Label>
                      <Select value={expenseCategory} onValueChange={(value: any) => setExpenseCategory(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplies">Supplies</SelectItem>
                          <SelectItem value="contractors">Contractors</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expense-vendor">Vendor/Supplier (Optional)</Label>
                    <Input
                      id="expense-vendor"
                      value={expenseVendor}
                      onChange={(e) => setExpenseVendor(e.target.value)}
                      placeholder="e.g., Home Depot, ABC Contractors"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-description">Description</Label>
                    <Textarea
                      id="expense-description"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="What was purchased/paid for..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="receipt-url">Receipt URL (Optional)</Label>
                    <Input
                      id="receipt-url"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      placeholder="Link to receipt image/document"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExpense}
                    disabled={expenseMutation.isPending}
                    variant="destructive"
                  >
                    {expenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${getCategoryColor('supplies')}`}>
                  {getCategoryIcon('supplies')}
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-600">Supplies</div>
                  <div className="font-medium">
                    {formatCurrency(houseBankStats?.expensesByCategory?.supplies || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${getCategoryColor('contractors')}`}>
                  {getCategoryIcon('contractors')}
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-600">Contractors</div>
                  <div className="font-medium">
                    {formatCurrency(houseBankStats?.expensesByCategory?.contractors || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${getCategoryColor('maintenance')}`}>
                  {getCategoryIcon('maintenance')}
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-600">Maintenance</div>
                  <div className="font-medium">
                    {formatCurrency(houseBankStats?.expensesByCategory?.maintenance || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${getCategoryColor('utilities')}`}>
                  {getCategoryIcon('utilities')}
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-600">Utilities</div>
                  <div className="font-medium">
                    {formatCurrency(houseBankStats?.expensesByCategory?.utilities || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${getCategoryColor('other')}`}>
                  {getCategoryIcon('other')}
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-600">Other</div>
                  <div className="font-medium">
                    {formatCurrency(houseBankStats?.expensesByCategory?.other || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(transaction.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.type === 'transfer_in' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className="text-sm">
                          {transaction.type === 'transfer_in' ? 'Transfer In' : 'Expense'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`p-1 rounded-full ${getCategoryColor(transaction.category)} mr-2`}>
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <span className="text-sm capitalize">{transaction.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.vendor || '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'transfer_in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
