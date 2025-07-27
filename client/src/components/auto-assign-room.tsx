import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Home, Calendar, User } from 'lucide-react';

interface AutoAssignRoomProps {
  inquiryId: string;
  inquiryName: string;
  onAssigned: () => void;
}

export default function AutoAssignRoom({ inquiryId, inquiryName, onAssigned }: AutoAssignRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const defaultPropertyId = user?.property || '';
  const [formData, setFormData] = useState({
    propertyId: defaultPropertyId,
    plan: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const { data: properties } = useQuery<any[]>({
    queryKey: ['/api/properties'],
  });

  const assignRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/inquiries/${inquiryId}/assign-room`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Room Assigned Successfully',
        description: `${inquiryName} has been assigned to room ${data.room.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setDialogOpen(false);
      onAssigned();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign room',
      });
    },
  });

  const handleAssignRoom = () => {
    if (!formData.propertyId || !formData.startDate || !formData.endDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      toast({
        variant: 'destructive',
        title: 'Invalid Dates',
        description: 'End date must be after start date.',
      });
      return;
    }

    // Calculate minimum stay based on plan
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (formData.plan === 'monthly' && daysDiff < 30) {
      toast({
        variant: 'destructive',
        title: 'Invalid Duration',
        description: 'Monthly plans require at least 30 days.',
      });
      return;
    }

    assignRoomMutation.mutate(formData);
  };

  // Calculate default end date based on plan
  const updateEndDate = (plan: string, startDate: string) => {
    if (!startDate) return;

    const start = new Date(startDate);
    let endDate = new Date(start);

    switch (plan) {
      case 'daily':
        endDate.setDate(start.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(start.getMonth() + 1);
        break;
    }

    setFormData(prev => ({
      ...prev,
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const filteredProperties = user?.role === 'manager' && user.property 
    ? properties?.filter(p => p.id === user.property) 
    : properties;

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-success-500 hover:bg-success-600"
          data-testid={`auto-assign-room-${inquiryId}`}
        >
          <Home className="h-4 w-4 mr-2" />
          Auto Assign Room
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-auto-assign-room" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Auto Assign Room - {inquiryName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="property">Property</Label>
            <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({...formData, propertyId: value})}
                disabled={user?.role === 'manager'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === 'manager' && (
                <p className="text-xs text-gray-500 mt-1">
                  You can only assign rooms at your managed property
                </p>
              )}
          </div>

          <div>
            <Label htmlFor="plan">Plan Type</Label>
            <Select 
              value={formData.plan} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, plan: value }));
                updateEndDate(value, formData.startDate);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setFormData(prev => ({ ...prev, startDate: newStartDate }));
                  updateEndDate(formData.plan, newStartDate);
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="bg-primary-50 p-3 rounded-lg">
            <p className="text-sm text-primary-700 flex items-start">
              <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              System will automatically assign the first available room in the selected property and generate access codes.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              data-testid="cancel-assign-room"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRoom}
              disabled={assignRoomMutation.isPending}
              className="bg-success-500 hover:bg-success-600"
              data-testid="confirm-assign-room"
            >
              {assignRoomMutation.isPending ? 'Assigning...' : 'Assign Room'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}