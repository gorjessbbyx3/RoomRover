import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'room' | 'payment' | 'cleaning' | 'task' | 'booking' | 'priority';
  className?: string;
}

export default function StatusBadge({ status, type = 'room', className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'room':
        switch (status) {
          case 'available':
            return { label: 'Available', className: 'bg-success-100 text-success-800' };
          case 'occupied':
            return { label: 'Occupied', className: 'bg-primary-100 text-primary-800' };
          case 'cleaning':
            return { label: 'Cleaning', className: 'bg-warning-100 text-warning-800' };
          case 'maintenance':
            return { label: 'Maintenance', className: 'bg-error-100 text-error-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      case 'payment':
        switch (status) {
          case 'paid':
            return { label: 'Paid', className: 'bg-success-100 text-success-800' };
          case 'pending':
            return { label: 'Pending', className: 'bg-warning-100 text-warning-800' };
          case 'overdue':
            return { label: 'Overdue', className: 'bg-error-100 text-error-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      case 'cleaning':
        switch (status) {
          case 'clean':
            return { label: 'Clean', className: 'bg-success-100 text-success-800' };
          case 'dirty':
            return { label: 'Needs Cleaning', className: 'bg-error-100 text-error-800' };
          case 'in_progress':
            return { label: 'In Progress', className: 'bg-warning-100 text-warning-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      case 'task':
        switch (status) {
          case 'pending':
            return { label: 'Pending', className: 'bg-warning-100 text-warning-800' };
          case 'in_progress':
            return { label: 'In Progress', className: 'bg-primary-100 text-primary-800' };
          case 'completed':
            return { label: 'Completed', className: 'bg-success-100 text-success-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      case 'priority':
        switch (status) {
          case 'low':
            return { label: 'Low', className: 'bg-gray-100 text-gray-800' };
          case 'normal':
            return { label: 'Normal', className: 'bg-primary-100 text-primary-800' };
          case 'high':
            return { label: 'High Priority', className: 'bg-warning-100 text-warning-800' };
          case 'critical':
            return { label: 'Critical', className: 'bg-error-100 text-error-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      case 'booking':
        switch (status) {
          case 'active':
            return { label: 'Active', className: 'bg-success-100 text-success-800' };
          case 'completed':
            return { label: 'Completed', className: 'bg-gray-100 text-gray-800' };
          case 'cancelled':
            return { label: 'Cancelled', className: 'bg-error-100 text-error-800' };
          default:
            return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
      
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      className={cn(config.className, 'text-xs font-semibold', className)}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </Badge>
  );
}
