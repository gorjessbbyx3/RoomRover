
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const membershipPlans = [
  {
    tier: 'pro',
    name: 'Pro',
    price: '$29/month',
    icon: Star,
    features: [
      'Priority room booking',
      'Extended stay discounts',
      'Guest privileges',
      'Priority support'
    ],
    color: 'from-blue-500 to-blue-700'
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: '$59/month',
    icon: Crown,
    features: [
      'All Pro features',
      'VIP room access',
      'Concierge services',
      'Monthly guest passes',
      'Priority cleaning',
      'Exclusive events access'
    ],
    color: 'from-yellow-400 to-yellow-600'
  }
];

export default function UpgradeModal({ trigger, open, onOpenChange }: UpgradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    if (!user) return;

    setIsUpgrading(true);
    setSelectedPlan(tier);

    try {
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Upgrade Initiated',
        description: `Your ${tier} membership upgrade has been initiated. You'll receive payment instructions shortly.`,
      });

      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upgrade Failed',
        description: 'Failed to initiate upgrade. Please try again.',
      });
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const modalContent = (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle className="text-2xl text-center">Upgrade Your Membership</DialogTitle>
        <p className="text-center text-gray-600">
          Unlock premium features and enhance your stay experience
        </p>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {membershipPlans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentlyUpgrading = isUpgrading && selectedPlan === plan.tier;

          return (
            <Card key={plan.tier} className="relative border-2 hover:border-primary-300 transition-colors">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-primary-600">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isUpgrading}
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                >
                  {isCurrentlyUpgrading ? 'Processing...' : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <strong>Note:</strong> All memberships include access to basic amenities. 
          Upgrades are processed manually and may take 24-48 hours to activate.
        </p>
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {modalContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {modalContent}
    </Dialog>
  );
}
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Users, Check, Zap, Shield, Headphones } from "lucide-react";

interface UpgradeModalProps {
  children: React.ReactNode;
  currentTier?: 'free' | 'pro' | 'premium';
}


