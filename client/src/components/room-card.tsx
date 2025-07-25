import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RoomWithDetails } from '@/lib/types';

interface RoomCardProps {
  room: RoomWithDetails;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function RoomCard({ room, onClick, size = 'sm' }: RoomCardProps) {
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
