
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Shield, Eye, EyeOff } from 'lucide-react';

interface MasterCode {
  id: string;
  property: string;
  masterCode: string;
  notes?: string;
  lastUpdated: string;
}

interface Property {
  id: string;
  name: string;
}

export default function MasterCodesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    property: '',
    masterCode: '',
    notes: ''
  });

  const { data: masterCodes = [], isLoading } = useQuery({
    queryKey: ['master-codes'],
    queryFn: async () => {
      const response = await fetch('/api/master-codes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch master codes');
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

  const addMasterCodeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/master-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add master code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-codes'] });
      setIsAddDialogOpen(false);
      setFormData({ property: '', masterCode: '', notes: '' });
      toast({
        title: 'Master Code Added',
        description: 'Master code has been successfully added.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add master code. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData(prev => ({ ...prev, masterCode: code }));
  };

  const toggleCodeVisibility = (id: string) => {
    setShowCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property || !formData.masterCode) {
      toast({
        title: 'Error',
        description: 'Property and master code are required.',
        variant: 'destructive',
      });
      return;
    }
    addMasterCodeMutation.mutate(formData);
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : propertyId;
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
          <Key className="h-8 w-8" />
          Master Codes Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage master door codes for property access and maintenance.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {masterCodes.length} master code{masterCodes.length !== 1 ? 's' : ''}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Master Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Master Code</DialogTitle>
              <DialogDescription>
                Add a new master code for property access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="property">Property *</Label>
                <Select value={formData.property} onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
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
              <div>
                <Label htmlFor="masterCode">Master Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="masterCode"
                    value={formData.masterCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, masterCode: e.target.value }))}
                    placeholder="Enter 4-digit code"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this master code"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMasterCodeMutation.isPending}>
                  {addMasterCodeMutation.isPending ? 'Adding...' : 'Add Master Code'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Codes</CardTitle>
          <CardDescription>
            Master codes provide access to properties for maintenance and management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading master codes...</div>
          ) : masterCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No master codes found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Master Code</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masterCodes.map((masterCode: MasterCode) => (
                  <TableRow key={masterCode.id}>
                    <TableCell className="font-medium">
                      {getPropertyName(masterCode.property)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showCodes[masterCode.id] ? masterCode.masterCode : '••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCodeVisibility(masterCode.id)}
                        >
                          {showCodes[masterCode.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {masterCode.notes ? (
                        <div className="truncate" title={masterCode.notes}>
                          {masterCode.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(masterCode.lastUpdated).toLocaleDateString()}
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
