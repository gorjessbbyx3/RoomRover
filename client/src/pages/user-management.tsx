
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Shield, UserCheck, UserX, Search, Filter, MoreHorizontal, Eye, EyeOff, Key, Settings, Activity, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

const availablePages = [
  { path: '/dashboard', label: 'Dashboard', description: 'Main dashboard with overview stats' },
  { path: '/inhouse', label: 'InHouse', description: 'Manage bookings and room assignments' },
  { path: '/payments', label: 'Payments', description: 'Handle payments and financial tracking' },
  { path: '/financial-management', label: '$ Management', description: 'Financial management and cash tracking' },
  { path: '/reports', label: 'Reports', description: 'Generate comprehensive reports' },
  { path: '/analytics', label: 'Analytics', description: 'Advanced analytics and insights' },
  { path: '/inquiries', label: 'Inquiries', description: 'Manage customer inquiries' },
  { path: '/user-management', label: 'User Management', description: 'Manage system users and permissions' },
  { path: '/banned-users-management', label: 'Banned Members', description: 'Manage banned members list' },
  { path: '/operations', label: 'Operations', description: 'Operational tasks and management' },
];

interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'helper';
  property: string | null;
  createdAt: string;
  lastActive?: string;
  isActive?: boolean;
}

interface Property {
  id: string;
  name: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPrivilegeDialogOpen, setIsPrivilegeDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [privilegeForm, setPrivilegeForm] = useState({
    role: 'helper' as 'admin' | 'manager' | 'helper',
    property: ''
  });
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'helper' as 'admin' | 'manager' | 'helper',
    property: ''
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
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

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          property: data.property || null
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      setFormData({
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: 'helper',
        property: ''
      });
      toast({
        title: 'User Created',
        description: 'User has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'User password has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updateUserPrivilegesMutation = useMutation({
    mutationFn: async ({ userId, role, property }: { userId: string; role: string; property: string | null }) => {
      const response = await fetch(`/api/users/${userId}/privileges`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role, property })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user privileges');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Privileges Updated',
        description: 'User privileges have been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update privileges. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updateUserPermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissions })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user permissions');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Permissions Updated',
        description: 'User page permissions have been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permissions. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesProperty = propertyFilter === 'all' || user.property === propertyFilter;
      
      return matchesSearch && matchesRole && matchesProperty;
    });
  }, [users, searchTerm, roleFilter, propertyFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.name || !formData.password) {
      toast({
        title: 'Error',
        description: 'Username, name, and password are required.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.role === 'manager' && !formData.property) {
      toast({
        title: 'Error',
        description: 'Property is required for manager role.',
        variant: 'destructive',
      });
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) {
      toast({
        title: 'Error',
        description: 'New password is required.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    changePasswordMutation.mutate({ 
      userId: selectedUser.id, 
      newPassword 
    });
    
    setIsPasswordDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  const openPrivilegeDialog = (user: User) => {
    setSelectedUser(user);
    setPrivilegeForm({
      role: user.role,
      property: user.property || ''
    });
    setIsPrivilegeDialogOpen(true);
  };

  const openPermissionsDialog = async (user: User) => {
    setSelectedUser(user);
    
    // Load current permissions or set defaults based on role
    try {
      let currentPermissions: string[] = [];
      
      if (user.allowedPages) {
        currentPermissions = JSON.parse(user.allowedPages);
      } else {
        // Set default permissions based on role
        switch (user.role) {
          case 'admin':
            currentPermissions = availablePages.map(p => p.path);
            break;
          case 'manager':
            currentPermissions = ['/dashboard', '/inhouse', '/payments', '/inquiries', '/operations'];
            break;
          case 'helper':
            currentPermissions = ['/dashboard', '/operations'];
            break;
        }
      }
      
      setUserPermissions(currentPermissions);
    } catch (error) {
      // If parsing fails, set defaults
      setUserPermissions(['/dashboard']);
    }
    
    setIsPermissionsDialogOpen(true);
  };

  const handlePrivilegeUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (privilegeForm.role === 'manager' && !privilegeForm.property) {
      toast({
        title: 'Error',
        description: 'Property is required for manager role.',
        variant: 'destructive',
      });
      return;
    }

    updateUserPrivilegesMutation.mutate({
      userId: selectedUser.id,
      role: privilegeForm.role,
      property: privilegeForm.property || null
    });
    
    setIsPrivilegeDialogOpen(false);
    setSelectedUser(null);
  };

  const handlePermissionToggle = (pagePath: string, isChecked: boolean) => {
    setUserPermissions(prev => {
      if (isChecked) {
        return [...prev, pagePath];
      } else {
        return prev.filter(path => path !== pagePath);
      }
    });
  };

  const handlePermissionsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    updateUserPermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: userPermissions
    });
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      helper: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPropertyName = (propertyId: string | null) => {
    if (!propertyId) return 'All Properties';
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : propertyId;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <UserCheck className="h-4 w-4" />;
      case 'helper':
        return <UserX className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const userCounts = {
    admin: users.filter((u: User) => u.role === 'admin').length,
    manager: users.filter((u: User) => u.role === 'manager').length,
    helper: users.filter((u: User) => u.role === 'helper').length,
    total: users.length
  };

  if (!currentUser || currentUser.role !== 'admin') {
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
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage system users, their permissions, and access levels.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {userCounts.admin}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userCounts.manager}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-green-500" />
              Helpers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userCounts.helper}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {users.filter((u: User) => u.isActive !== false).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {userCounts.total}
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
                placeholder="Search users by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="helper">Helper</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property: Property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setPropertyFilter('all');
              }} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="create-user-description">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription id="create-user-description">
                Add a new user to the system with appropriate permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                    required
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as typeof formData.role }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full system access</SelectItem>
                    <SelectItem value="manager">Manager - Property management</SelectItem>
                    <SelectItem value="helper">Helper - Cleaning and maintenance tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === 'manager' && (
                <div>
                  <Label htmlFor="property">Assigned Property *</Label>
                  <Select value={formData.property} onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property: Property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage user accounts, permissions, and access levels for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || roleFilter !== 'all' || propertyFilter !== 'all' 
                ? 'No users match your search criteria.' 
                : 'No users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role & Access</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 font-mono">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getRoleBadge(user.role)} flex items-center gap-1 w-fit border`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getPropertyName(user.property)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={user.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {user.isActive !== false ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.lastActive && (
                          <div className="text-xs text-gray-500">
                            Last: {new Date(user.lastActive).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                              <Key className="h-4 w-4 mr-2" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPrivilegeDialog(user)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Privileges
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                              <Lock className="h-4 w-4 mr-2" />
                              Manage Page Access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent aria-describedby="password-change-description">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription id="password-change-description">
              Update the password for {selectedUser?.name} ({selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Privilege Update Dialog */}
      <Dialog open={isPrivilegeDialogOpen} onOpenChange={setIsPrivilegeDialogOpen}>
        <DialogContent aria-describedby="privilege-update-description">
          <DialogHeader>
            <DialogTitle>Update User Privileges</DialogTitle>
            <DialogDescription id="privilege-update-description">
              Modify role and permissions for {selectedUser?.name} ({selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePrivilegeUpdate} className="space-y-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={privilegeForm.role} 
                onValueChange={(value) => setPrivilegeForm(prev => ({ ...prev, role: value as typeof privilegeForm.role }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full system access</SelectItem>
                  <SelectItem value="manager">Manager - Property management</SelectItem>
                  <SelectItem value="helper">Helper - Cleaning and maintenance tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {privilegeForm.role === 'manager' && (
              <div>
                <Label htmlFor="property">Assigned Property *</Label>
                <Select 
                  value={privilegeForm.property} 
                  onValueChange={(value) => setPrivilegeForm(prev => ({ ...prev, property: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsPrivilegeDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserPrivilegesMutation.isPending}
              >
                {updateUserPrivilegesMutation.isPending ? 'Updating...' : 'Update Privileges'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Page Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-lg" aria-describedby="permissions-update-description">
          <DialogHeader>
            <DialogTitle>Manage Page Access</DialogTitle>
            <DialogDescription id="permissions-update-description">
              Control which pages {selectedUser?.name} can access in the navigation menu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePermissionsUpdate} className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="text-sm text-gray-600 mb-4">
                Select the pages this user should have access to:
              </div>
              {availablePages.map((page) => (
                <div key={page.path} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`page-${page.path}`}
                    checked={userPermissions.includes(page.path)}
                    onCheckedChange={(checked) => handlePermissionToggle(page.path, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`page-${page.path}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {page.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {page.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                Role-based restrictions still apply. Users can only access pages their role permits.
              </span>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsPermissionsDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserPermissionsMutation.isPending}
              >
                {updateUserPermissionsMutation.isPending ? 'Updating...' : 'Update Permissions'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
