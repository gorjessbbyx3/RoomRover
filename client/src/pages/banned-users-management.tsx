
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserX, Plus, Trash2, Shield } from 'lucide-react';

interface BannedUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  reason: string;
  bannedBy: string;
  bannedDate: string;
}

export default function BannedUsersManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    addBannedUserMutation.mutate(formData);
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

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserX className="h-8 w-8" />
          Banned Users Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage users who are banned from making inquiries or bookings.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {bannedUsers.length} banned user{bannedUsers.length !== 1 ? 's' : ''}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ban User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Add a user to the banned list to prevent future inquiries and bookings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for banning"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addBannedUserMutation.isPending}>
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
            Users on this list cannot submit inquiries or make bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading banned users...</div>
          ) : bannedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No banned users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Banned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedUsers.map((bannedUser: BannedUser) => (
                  <TableRow key={bannedUser.id}>
                    <TableCell className="font-medium">{bannedUser.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {bannedUser.email && (
                          <div className="text-sm">{bannedUser.email}</div>
                        )}
                        {bannedUser.phone && (
                          <div className="text-sm text-gray-500">{bannedUser.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={bannedUser.reason}>
                        {bannedUser.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(bannedUser.bannedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBannedUserMutation.mutate(bannedUser.id)}
                        disabled={removeBannedUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
