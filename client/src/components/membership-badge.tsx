
import { Badge } from '@/components/ui/badge';
import { Crown, Star, User } from 'lucide-react';

interface MembershipBadgeProps {
  tier: 'free' | 'pro' | 'premium';
  className?: string;
}

export default function MembershipBadge({ tier, className }: MembershipBadgeProps) {
  const getTierConfig = () => {
    switch (tier) {
      case 'premium':
        return {
          icon: Crown,
          label: 'Premium',
          className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
        };
      case 'pro':
        return {
          icon: Star,
          label: 'Pro',
          className: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
        };
      default:
        return {
          icon: User,
          label: 'Free',
          className: 'bg-gray-200 text-gray-800'
        };
    }
  };

  const config = getTierConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
