import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RoomWithDetails } from '@/lib/types';
import { Trash2, Eye, Home, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RoomCardProps {
  room: RoomWithDetails;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function RoomCard({ room, onClick, size = 'sm' }: RoomCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isViewingRoom, setIsViewingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const bookRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) {
        throw new Error('You must be logged in to book a room');
      }

      const response = await apiRequest('POST', '/api/bookings', {
        roomId,
        userId: user.id,
        checkIn: new Date().toISOString(),
        plan: 'monthly',
        totalAmount: room.price
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Booking Created',
        description: `Room ${room.roomNumber} has been successfully booked.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setLocation('/inhouse');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: error.message || 'Failed to book room. Please try again.',
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiRequest('DELETE', `/api/rooms/${roomId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Room Deleted',
        description: `Room ${room.roomNumber} has been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete room. Please try again.',
      });
    },
  });

  const handleBookRoom = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to book a room.',
      });
      setLocation('/login');
      return;
    }

    if (room.status !== 'available') {
      toast({
        variant: 'destructive',
        title: 'Room Unavailable',
        description: 'This room is not currently available for booking.',
      });
      return;
    }

    bookRoomMutation.mutate(room.id);
  };

  const handleViewDetails = () => {
    // Verify room ID exists before navigating
    if (room.id) {
      setLocation(`/room/${room.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Room',
        description: 'Room information is incomplete. Please refresh and try again.',
      });
    }
  };

  const handleDeleteRoom = () => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to delete rooms.',
      });
      return;
    }
    deleteRoomMutation.mutate(room.id);
  };

  const getStatusColor = () => {
    switch (room.status) {
      case 'available':
        return 'bg-success-50 border-success-200';
      case 'occupied':
        return 'bg-primary-50 border-primary-200';
      case 'cleaning':
        return 'bg-warning-50 border-warning-200';
      case 'maintenance':
        return 'bg-error-50 border-error-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = () => {
    switch (room.status) {
      case 'available':
        return 'text-success-800';
      case 'occupied':
        return 'text-primary-800';
      case 'cleaning':
        return 'text-warning-800';
      case 'maintenance':
        return 'text-error-800';
      default:
        return 'text-gray-800';
    }
  };

  const getStatusDotColor = () => {
    switch (room.status) {
      case 'available':
        return 'bg-success-500';
      case 'occupied':
        return 'bg-primary-500';
      case 'cleaning':
        return 'bg-warning-500';
      case 'maintenance':
        return 'bg-error-500';
      default:
        return 'bg-gray-500';
    }
  };

  const statusLabel = room.status.charAt(0).toUpperCase() + room.status.slice(1);

  return (
    <Card 
      className={cn(
        'border rounded-lg cursor-pointer transition-all hover:shadow-md',
        getStatusColor(),
        size === 'sm' ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
      data-testid={`room-card-${room.id}`}
    >
      <div className="text-center">
        <div className={cn(
          'font-medium',
          getStatusTextColor(),
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {room.id}
        </div>
        <div className={cn(
          'mt-1',
          getStatusTextColor(),
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {statusLabel}
        </div>
        <div className={cn(
          'rounded-full mx-auto mt-2',
          getStatusDotColor(),
          size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
        )}></div>

        {size !== 'sm' && (
          <div className="mt-4 flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={isViewingRoom}
              onClick={async () => {
                setIsViewingRoom(true);
                setRoomError(null);

                try {
                  // Validate room exists
                  const response = await fetch(`/api/rooms/${room.id}`, {
                    headers: {
                      'Authorization': `Bearer ${user?.token}`
                    }
                  });

                  if (!response.ok) {
                    throw new Error('Room not found or unavailable');
                  }

                  // Navigate to room details
                  window.location.href = `/rooms/${room.id}`;
                } catch (error) {
                  setRoomError(error.message);
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Unable to view room details. Please try again.',
                  });
                } finally {
                  setIsViewingRoom(false);
                }
              }}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              {isViewingRoom ? 'Loading...' : 'View'}
            </Button>

            {roomError && (
              <div className="flex items-center text-red-600 text-xs mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {roomError}
              </div>
            )}

            {room.status === 'available' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBookRoom}
                disabled={bookRoomMutation.isPending}
                className="flex-1"
              >
                <Home className="h-3 w-3 mr-1" />
                {bookRoomMutation.isPending ? 'Booking...' : 'Book'}
              </Button>
            )}

            {user && (user.role === 'admin' || user.role === 'manager') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Room</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete room {room.roomNumber}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteRoom}
                      disabled={deleteRoomMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteRoomMutation.isPending ? 'Deleting...' : 'Delete Room'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}