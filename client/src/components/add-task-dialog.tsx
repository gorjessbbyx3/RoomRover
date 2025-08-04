import { useState } from 'react';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Repeat, Package } from 'lucide-react';
import type { Property } from '@/lib/types';

interface AddTaskDialogProps {
  trigger?: React.ReactNode;
}

export default function AddTaskDialog({ trigger }: AddTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [taskData, setTaskData] = useState({
    type: '',
    title: '',
    description: '',
    priority: 'medium',
    propertyId: user?.property || '',
    roomId: '',
    dueDate: '',
    isRecurring: false,
    recurringType: '',
    linkedInventoryItems: [] as string[]
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Zod schema for validation
  const taskSchema = z.object({
    type: z.string().min(1, 'Task type is required'),
    title: z.string().min(1, 'Task title is required'),
    propertyId: z.string().min(1, 'Property is required'),
    priority: z.string(),
    description: z.string().optional(),
    roomId: z.string().optional(),
    dueDate: z.string().optional(),
    isRecurring: z.boolean(),
    recurringType: z.string().optional(),
    linkedInventoryItems: z.array(z.string()).optional()
  });

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch rooms for selected property
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', taskData.propertyId],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const allRooms = await response.json();
      return taskData.propertyId ? allRooms.filter((room: any) => room.propertyId === taskData.propertyId) : allRooms;
    },
    enabled: !!taskData.propertyId
  });

  // Fetch inventory for selected property
  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ['inventory', taskData.propertyId],
    queryFn: async () => {
      const response = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const allInventory = await response.json();
      return taskData.propertyId ? allInventory.filter((item: any) => item.propertyId === taskData.propertyId) : allInventory;
    },
    enabled: !!taskData.propertyId
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const response = await fetch('/api/cleaning-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTask)
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Success", description: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setTaskData({
      type: '',
      title: '',
      description: '',
      priority: 'medium',
      propertyId: user?.property || '',
      roomId: '',
      dueDate: '',
      isRecurring: false,
      recurringType: '',
      linkedInventoryItems: []
    });
  };

  const handleSubmit = () => {
    setFieldErrors({});
    const parseResult = taskSchema.safeParse(taskData);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      toast({ title: "Error", description: "Please fix the highlighted errors.", variant: "destructive" });
      return;
    }
    const newTask = {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
      status: 'pending',
      assignedTo: null,
      notes: taskData.linkedInventoryItems.length > 0 ? 
        `Linked inventory items: ${taskData.linkedInventoryItems.join(', ')}` : null,
      recurringType: taskData.isRecurring ? taskData.recurringType : null
    };
    createTaskMutation.mutate(newTask);
  };

  const handleInventoryItemToggle = (itemId: string) => {
    setTaskData(prev => ({
      ...prev,
      linkedInventoryItems: prev.linkedInventoryItems.includes(itemId)
        ? prev.linkedInventoryItems.filter(id => id !== itemId)
        : [...prev.linkedInventoryItems, itemId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="add-task-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Cleaning Task
          </DialogTitle>
          <DialogDescription id="add-task-dialog-description">
            Create a new task for rooms or common areas with optional scheduling and inventory links
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
            <Label htmlFor="task-type">Task Type *</Label>
            {fieldErrors.type && <span className="text-red-600 text-xs">{fieldErrors.type}</span>}
              <Select value={taskData.type} onValueChange={(value) => setTaskData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_cleaning">Room Cleaning</SelectItem>
                  <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                  <SelectItem value="linen_change">Linen Change</SelectItem>
                  <SelectItem value="common_area">Common Area Cleaning</SelectItem>
                  <SelectItem value="maintenance_cleaning">Maintenance Cleaning</SelectItem>
                  <SelectItem value="trash_pickup">Trash Pickup</SelectItem>
                  <SelectItem value="laundry">Laundry</SelectItem>
                  <SelectItem value="inventory_check">Inventory Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={taskData.priority} onValueChange={(value) => setTaskData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Title */}
          <div className="grid gap-2">
            <Label htmlFor="task-title">Task Title *</Label>
            {fieldErrors.title && <span className="text-red-600 text-xs">{fieldErrors.title}</span>}
            <Input
              id="task-title"
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Clean Room P1-R1, Vacuum Common Area"
            />
          </div>

          {/* Property and Room Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-property">Property *</Label>
              {fieldErrors.propertyId && <span className="text-red-600 text-xs">{fieldErrors.propertyId}</span>}
              <Select 
                value={taskData.propertyId} 
                onValueChange={(value) => setTaskData(prev => ({ ...prev, propertyId: value, roomId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-room">Room (Optional)</Label>
              <Select 
                value={taskData.roomId} 
                onValueChange={(value) => setTaskData(prev => ({ ...prev, roomId: value }))}
                disabled={!taskData.propertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific room</SelectItem>
                  {rooms.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Description */}
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={taskData.description}
              onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the cleaning task..."
              className="min-h-[80px]"
            />
          </div>

          {/* Due Date */}
          <div className="grid gap-2">
            <Label htmlFor="task-due-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="task-due-date"
              type="datetime-local"
              value={taskData.dueDate}
              onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          {/* Recurring Options */}
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={taskData.isRecurring}
                onCheckedChange={(checked) => setTaskData(prev => ({ 
                  ...prev, 
                  isRecurring: checked as boolean,
                  recurringType: checked ? 'weekly' : ''
                }))}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Make this a recurring task
              </Label>
            </div>

            {taskData.isRecurring && (
              <div className="ml-6 mt-2">
                <Label htmlFor="recurring-type">Repeat Frequency</Label>
                <Select 
                  value={taskData.recurringType} 
                  onValueChange={(value) => setTaskData(prev => ({ ...prev, recurringType: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Linked Inventory Items */}
          {taskData.propertyId && inventory.length > 0 && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Link Inventory Items (Optional)
              </Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="grid gap-2">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`inventory-${item.id}`}
                        checked={taskData.linkedInventoryItems.includes(item.id)}
                        onCheckedChange={() => handleInventoryItemToggle(item.id)}
                      />
                      <Label htmlFor={`inventory-${item.id}`} className="text-sm">
                        {item.item} ({item.quantity} {item.unit})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {taskData.linkedInventoryItems.length > 0 && (
                <p className="text-sm text-gray-600">
                  {taskData.linkedInventoryItems.length} item(s) selected
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createTaskMutation.isPending || !taskData.type || !taskData.title || !taskData.propertyId}
          >
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}