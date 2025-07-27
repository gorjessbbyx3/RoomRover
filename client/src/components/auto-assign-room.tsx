import { useState, useCallback, useMemo } from 'react';
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
import { Home, Calendar, User, Clock, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const defaultPropertyId = user?.property || '';
  const [formData, setFormData] = useState({
    propertyId: defaultPropertyId,
    plan: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.propertyId) {
      errors.propertyId = 'Property selection is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
      
      // Plan-specific validation
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (formData.plan === 'monthly' && daysDiff < 30) {
        errors.endDate = 'Monthly plans require at least 30 days';
      } else if (formData.plan === 'weekly' && daysDiff < 7) {
        errors.endDate = 'Weekly plans require at least 7 days';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get available rooms for the selected property
  const { data: availableRooms, isLoading: roomsLoading } = useQuery<any[]>({
    queryKey: ['/api/rooms', formData.propertyId],
    enabled: !!formData.propertyId,
    select: (data) => data?.filter(room => room.status === 'available') || [],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Memoized filtered properties for better performance
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    return user?.role === 'manager' && user.property 
      ? properties.filter(p => p.id === user.property) 
      : properties;
  }, [properties, user]);

  const assignRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      // Pre-validate before sending request
      if (!validateForm()) {
        throw new Error('Please fix form validation errors');
      }
      
      const response = await apiRequest('POST', `/api/inquiries/${inquiryId}/assign-room`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign room');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Room Assigned Successfully',
        description: `${inquiryName} has been assigned to room ${data.room?.id || 'N/A'}`,
        action: (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Assignment Complete</span>
          </div>
        ),
      });
      
      // Optimistic updates for better UX
      queryClient.setQueryData(['/api/inquiries'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((inquiry: any) => 
          inquiry.id === inquiryId 
            ? { ...inquiry, status: 'booking_confirmed', bookingId: data.booking?.id }
            : inquiry
        );
      });
      
      // Batch invalidate related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] }),
      ]);
      
      setDialogOpen(false);
      setValidationErrors({});
      onAssigned();
    },
    onError: (error: any) => {
      console.error('Room assignment error:', error);
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign room. Please try again.',
        action: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span>Try Again</span>
          </div>
        ),
      });
    },
  });

  const handleAssignRoom = useCallback(() => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please correct the highlighted fields before proceeding.',
      });
      return;
    }

    // Additional availability check
    if (availableRooms && availableRooms.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Available Rooms',
        description: 'No rooms are currently available at the selected property.',
      });
      return;
    }

    assignRoomMutation.mutate(formData);
  }, [formData, validateForm, availableRooms, assignRoomMutation, toast]);

  // Calculate default end date based on plan with better logic
  const updateEndDate = useCallback((plan: string, startDate: string) => {
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
        // Handle month boundaries properly
        endDate.setMonth(start.getMonth() + 1);
        // If the day doesn't exist in the next month, set to last day of month
        if (endDate.getDate() !== start.getDate()) {
          endDate.setDate(0); // Last day of previous month
        }
        break;
    }

    setFormData(prev => ({
      ...prev,
      endDate: endDate.toISOString().split('T')[0]
    }));
    
    // Clear validation errors when dates are updated
    setValidationErrors(prev => ({
      ...prev,
      endDate: ''
    }));
  }, []);

  // Calculate estimated pricing
  const estimatedPricing = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !filteredProperties.length) return null;
    
    const property = filteredProperties.find(p => p.id === formData.propertyId);
    if (!property) return null;
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let baseRate = 0;
    switch (formData.plan) {
      case 'daily':
        baseRate = property.rateDaily * days;
        break;
      case 'weekly':
        baseRate = property.rateWeekly;
        break;
      case 'monthly':
        baseRate = property.rateMonthly;
        break;
    }
    
    return {
      baseRate,
      days,
      plan: formData.plan
    };
  }, [formData, filteredProperties]);

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
            <Label htmlFor="property" className={validationErrors.propertyId ? 'text-red-500' : ''}>
              Property {validationErrors.propertyId && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={formData.propertyId} 
              onValueChange={(value) => {
                setFormData({...formData, propertyId: value});
                setValidationErrors(prev => ({...prev, propertyId: ''}));
              }}
              disabled={user?.role === 'manager' || propertiesLoading}
            >
              <SelectTrigger className={validationErrors.propertyId ? 'border-red-500' : ''}>
                <SelectValue placeholder={propertiesLoading ? "Loading properties..." : "Select property"} />
              </SelectTrigger>
              <SelectContent>
                {filteredProperties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{property.name}</span>
                      {availableRooms && formData.propertyId === property.id && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({availableRooms.length} available)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.propertyId && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validationErrors.propertyId}
              </p>
            )}
            {user?.role === 'manager' && (
              <p className="text-xs text-gray-500 mt-1">
                You can only assign rooms at your managed property
              </p>
            )}
            {roomsLoading && formData.propertyId && (
              <p className="text-xs text-blue-500 mt-1 flex items-center">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Checking room availability...
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
              <Label htmlFor="start-date" className={validationErrors.startDate ? 'text-red-500' : ''}>
                Start Date {validationErrors.startDate && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setFormData(prev => ({ ...prev, startDate: newStartDate }));
                  updateEndDate(formData.plan, newStartDate);
                  setValidationErrors(prev => ({...prev, startDate: ''}));
                }}
                min={new Date().toISOString().split('T')[0]}
                className={validationErrors.startDate ? 'border-red-500' : ''}
              />
              {validationErrors.startDate && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.startDate}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="end-date" className={validationErrors.endDate ? 'text-red-500' : ''}>
                End Date {validationErrors.endDate && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, endDate: e.target.value }));
                  setValidationErrors(prev => ({...prev, endDate: ''}));
                }}
                min={formData.startDate}
                className={validationErrors.endDate ? 'border-red-500' : ''}
              />
              {validationErrors.endDate && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.endDate}
                </p>
              )}
            </div>
          </div>

          {estimatedPricing && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Estimated Cost: <strong className="ml-1">${estimatedPricing.baseRate}</strong>
                {estimatedPricing.plan === 'daily' && (
                  <span className="ml-1">({estimatedPricing.days} days)</span>
                )}
              </p>
            </div>
          )}

          <div className="bg-primary-50 p-3 rounded-lg">
            <p className="text-sm text-primary-700 flex items-start">
              <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              System will automatically assign the first available room in the selected property and generate access codes.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogOpen(false);
                setValidationErrors({});
              }}
              disabled={assignRoomMutation.isPending}
              data-testid="cancel-assign-room"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRoom}
              disabled={
                assignRoomMutation.isPending || 
                propertiesLoading || 
                roomsLoading || 
                (availableRooms && availableRooms.length === 0) ||
                Object.keys(validationErrors).some(key => validationErrors[key])
              }
              className="bg-success-500 hover:bg-success-600 disabled:opacity-50"
              data-testid="confirm-assign-room"
            >
              {assignRoomMutation.isPending ? (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </div>
              ) : availableRooms && availableRooms.length === 0 && formData.propertyId ? (
                'No Rooms Available'
              ) : (
                'Assign Room'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}