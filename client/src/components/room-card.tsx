import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RoomWithDetails } from '@/lib/types';

interface RoomCardProps {
  room: RoomWithDetails;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function RoomCard({ room, onClick, size = 'sm' }: RoomCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      navigate('/inhouse');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: error.message || 'Failed to book room. Please try again.',
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
      navigate('/login');
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
    navigate(`/room/${room.id}`);
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
      </div>
    </Card>
  );
}