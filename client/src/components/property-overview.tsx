import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RoomCard from './room-card';
import { PropertyWithRooms } from '@/lib/types';

interface PropertyOverviewProps {
  property: PropertyWithRooms;
  onRoomClick?: (roomId: string) => void;
}

export default function PropertyOverview({ property, onRoomClick }: PropertyOverviewProps) {
  const gridCols = property.id === 'P1' ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <Card className="shadow-material">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">
          {property.name}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {property.description} • ${property.rateDaily}/day, ${property.rateWeekly}/week, ${property.rateMonthly}/month
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className={`grid ${gridCols} gap-3`} data-testid={`property-grid-${property.id}`}>
          {property.rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => onRoomClick?.(room.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
