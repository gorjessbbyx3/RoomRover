import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, AlertTriangle, Edit, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  propertyId: string;
  item: string;
  quantity: number;
  threshold: number;
  unit: string;
  notes?: string;
  lastUpdated: string;
}

interface Property {
  id: string;
  name: string;
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    item: '',
    quantity: '',
    threshold: '',
    unit: '',
    notes: ''
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch inventory');
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

  const createInventoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          quantity: parseInt(data.quantity),
          threshold: parseInt(data.threshold)
        })
      });
      if (!response.ok) throw new Error('Failed to create inventory item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Inventory Item Added',
        description: 'Inventory item has been successfully added.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add inventory item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      toast({
        title: 'Inventory Updated',
        description: 'Inventory item has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update inventory item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      propertyId: '',
      item: '',
      quantity: '',
      threshold: '',
      unit: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.item || !formData.quantity || !formData.threshold) {
      toast({
        title: 'Error',
        description: 'All required fields must be filled.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedItem) {
      updateInventoryMutation.mutate({
        id: selectedItem.id,
        data: {
          propertyId: formData.propertyId,
          item: formData.item,
          quantity: parseInt(formData.quantity),
          threshold: parseInt(formData.threshold),
          unit: formData.unit,
          notes: formData.notes || undefined
        }
      });
    } else {
      createInventoryMutation.mutate(formData);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      propertyId: item.propertyId,
      item: item.item,
      quantity: item.quantity.toString(),
      threshold: item.threshold.toString(),
      unit: item.unit,
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : propertyId;
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.threshold;
  const isOutOfStock = (item: InventoryItem) => item.quantity === 0;

  const lowStockItems = inventory.filter(isLowStock);
  const outOfStockItems = inventory.filter(isOutOfStock);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin or manager role required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-8 w-8" />
          Inventory Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage inventory items and stock levels across properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {outOfStockItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inventory.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {inventory.length} inventory item{inventory.length !== 1 ? 's' : ''}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setSelectedItem(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new item to track in your inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="propertyId">Property *</Label>
                <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
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
                <Label htmlFor="item">Item Name *</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                  placeholder="e.g., Sheet Sets, Towels, Toiletries"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Current Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="threshold">Low Stock Threshold *</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={formData.threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                    placeholder="5"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                    <SelectItem value="rolls">Rolls</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or specifications"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createInventoryMutation.isPending}>
                  {createInventoryMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the inventory item details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-propertyId">Property *</Label>
              <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
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
              <Label htmlFor="edit-item">Item Name *</Label>
              <Input
                id="edit-item"
                value={formData.item}
                onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                placeholder="e.g., Sheet Sets, Towels, Toiletries"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Current Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-threshold">Low Stock Threshold *</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="0"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                  placeholder="5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="sets">Sets</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="rolls">Rolls</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or specifications"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateInventoryMutation.isPending}>
                {updateInventoryMutation.isPending ? 'Updating...' : 'Update Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Track stock levels and manage inventory across all properties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No inventory items found. Add your first item to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item: InventoryItem) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {getPropertyName(item.propertyId)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.item}</div>
                        {item.notes && (
                          <div className="text-sm text-gray-500">{item.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={isOutOfStock(item) ? 'text-red-600 font-bold' : isLowStock(item) ? 'text-yellow-600 font-bold' : ''}>
                        {item.quantity} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>{item.threshold} {item.unit}</TableCell>
                    <TableCell>
                      {isOutOfStock(item) ? (
                        <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                      ) : isLowStock(item) ? (
                        <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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