
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserX, Plus, Trash2, Shield, Search, Filter, Mail, Phone, Calendar, User, AlertTriangle, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface BannedUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  reason: string;
  bannedBy: string;
  bannedDate: string;
  bannedByName?: string;
}

export default function BannedUsersManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    reason: ''
  });

  const { data: bannedUsers = [], isLoading } = useQuery({
    queryKey: ['banned-users'],
    queryFn: async () => {
      const response = await fetch('/api/banned-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch banned users');
      return response.json();
    }
  });

  const addBannedUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/banned-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to ban user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      setIsAddDialogOpen(false);
      setFormData({ name: '', phone: '', email: '', reason: '' });
      toast({
        title: 'User Banned',
        description: 'User has been successfully added to the banned list.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to ban user. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const removeBannedUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/banned-users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to unban user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      toast({
        title: 'User Unbanned',
        description: 'User has been removed from the banned list.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to unban user. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id => 
          fetch(`/api/banned-users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      setSelectedUsers([]);
      toast({
        title: 'Users Unbanned',
        description: `${selectedUsers.length} users have been removed from the banned list.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to unban selected users. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Filter and search banned users
  const filteredUsers = useMemo(() => {
    return bannedUsers.filter((bannedUser: BannedUser) => {
      const matchesSearch = bannedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (bannedUser.email && bannedUser.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (bannedUser.phone && bannedUser.phone.includes(searchTerm));
      
      const matchesReason = reasonFilter === 'all' || 
                           bannedUser.reason.toLowerCase().includes(reasonFilter.toLowerCase());
      
      return matchesSearch && matchesReason;
    });
  }, [bannedUsers, searchTerm, reasonFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.reason) {
      toast({
        title: 'Error',
        description: 'Name and reason are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email && !formData.phone) {
      toast({
        title: 'Error',
        description: 'Either email or phone number is required.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    addBannedUserMutation.mutate(formData);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? filteredUsers.map((user: BannedUser) => user.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const getReasonBadge = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('spam') || lowerReason.includes('solicitation')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (lowerReason.includes('abuse') || lowerReason.includes('harassment')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (lowerReason.includes('fraud') || lowerReason.includes('payment')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (lowerReason.includes('violation') || lowerReason.includes('policy')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const exportToCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Reason', 'Banned Date', 'Banned By'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user: BannedUser) => [
        `"${user.name}"`,
        `"${user.email || ''}"`,
        `"${user.phone || ''}"`,
        `"${user.reason.replace(/"/g, '""')}"`,
        `"${new Date(user.bannedDate).toLocaleDateString()}"`,
        `"${user.bannedByName || user.bannedBy}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banned-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reasonSuggestions = [
    'Spam/Solicitation',
    'Harassment/Abuse',
    'Fraudulent Activity',
    'Policy Violation',
    'Payment Issues',
    'Inappropriate Behavior',
    'Multiple Violations'
  ];

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

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserX className="h-8 w-8" />
          Banned Users Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage users who are banned from making inquiries or bookings to protect your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Total Banned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {bannedUsers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {bannedUsers.filter((u: BannedUser) => 
                new Date(u.bannedDate).getMonth() === new Date().getMonth()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-500" />
              Email Bans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bannedUsers.filter((u: BannedUser) => u.email).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange-500" />
              Phone Bans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {bannedUsers.filter((u: BannedUser) => u.phone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam/Solicitation</SelectItem>
                  <SelectItem value="abuse">Harassment/Abuse</SelectItem>
                  <SelectItem value="fraud">Fraudulent Activity</SelectItem>
                  <SelectItem value="policy">Policy Violation</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCsv} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {bannedUsers.length} banned user{bannedUsers.length !== 1 ? 's' : ''}
          </div>
          {selectedUsers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Unban Selected ({selectedUsers.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unban Multiple Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} from the banned list? 
                    They will be able to submit inquiries and make bookings again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => bulkRemoveMutation.mutate(selectedUsers)}
                    disabled={bulkRemoveMutation.isPending}
                  >
                    {bulkRemoveMutation.isPending ? 'Unbanning...' : 'Unban Users'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ban User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Add a user to the banned list to prevent future inquiries and bookings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">Reason for Banning *</Label>
                <Select 
                  value={formData.reason} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason or type custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonSuggestions.map(reason => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  className="mt-2"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide detailed reason for banning this user..."
                  required
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>This user will be completely blocked from submitting inquiries or making bookings. Make sure you have valid reasons for this action.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addBannedUserMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {addBannedUserMutation.isPending ? 'Banning...' : 'Ban User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banned Users List</CardTitle>
          <CardDescription>
            Users on this list are completely blocked from submitting inquiries or making bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading banned users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || reasonFilter !== 'all' 
                ? 'No banned users match your search criteria.' 
                : 'No banned users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={handleSelectAll}
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                      />
                    </TableHead>
                    <TableHead>User Details</TableHead>
                    <TableHead>Contact Information</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Banned Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((bannedUser: BannedUser) => (
                    <TableRow key={bannedUser.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(bannedUser.id)}
                          onCheckedChange={(checked) => handleSelectUser(bannedUser.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{bannedUser.name}</div>
                            <div className="text-xs text-red-600 font-medium">BANNED USER</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {bannedUser.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {bannedUser.email}
                            </div>
                          )}
                          {bannedUser.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {bannedUser.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <Badge className={`${getReasonBadge(bannedUser.reason)} border mb-1`}>
                          {bannedUser.reason.split(' ').slice(0, 2).join(' ')}...
                        </Badge>
                        <div className="text-sm text-gray-600 line-clamp-2" title={bannedUser.reason}>
                          {bannedUser.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(bannedUser.bannedDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            by {bannedUser.bannedByName || 'Admin'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={removeBannedUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unban User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{bannedUser.name}</strong> from the banned list? 
                                They will be able to submit inquiries and make bookings again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeBannedUserMutation.mutate(bannedUser.id)}
                                disabled={removeBannedUserMutation.isPending}
                              >
                                {removeBannedUserMutation.isPending ? 'Unbanning...' : 'Unban User'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
