
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Users } from 'lucide-react';

interface MembershipBadgeProps {
  tier: 'free' | 'pro' | 'premium';
  className?: string;
}

export default function MembershipBadge({ tier, className }: MembershipBadgeProps) {
  const getConfig = (tier: string) => {
    switch (tier) {
      case 'premium':
        return {
          icon: Crown,
          label: 'Premium',
          variant: 'default' as const,
          className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        };
      case 'pro':
        return {
          icon: Star,
          label: 'Pro',
          variant: 'secondary' as const,
          className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
        };
      default:
        return {
          icon: Users,
          label: 'Free',
          variant: 'outline' as const,
          className: 'border-gray-300 text-gray-600'
        };
    }
  };

  const config = getConfig(tier);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
