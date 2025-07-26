
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

export function UpgradeModal({ children, currentTier = 'free' }: UpgradeModalProps) {
  const [open, setOpen] = useState(false);

  const plans = [
    {
      tier: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Users,
      description: 'Perfect for getting started',
      features: [
        'Basic room management',
        'Standard booking system',
        'Email support',
        'Basic reports'
      ],
      buttonText: 'Current Plan',
      disabled: currentTier === 'free'
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      icon: Star,
      description: 'Great for growing businesses',
      features: [
        'Everything in Free',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Automated workflows',
        'Advanced reporting'
      ],
      buttonText: currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentTier === 'pro',
      popular: true
    },
    {
      tier: 'premium',
      name: 'Premium',
      price: '$79',
      period: 'per month',
      icon: Crown,
      description: 'For enterprise-level operations',
      features: [
        'Everything in Pro',
        'AI-powered insights',
        'White-label solution',
        '24/7 phone support',
        'Custom development',
        'Dedicated account manager'
      ],
      buttonText: currentTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      disabled: currentTier === 'premium'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.tier} 
                className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.tier === 'premium' ? 'bg-purple-100 text-purple-600' :
                      plan.tier === 'pro' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  </div>
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
                    className="w-full" 
                    disabled={plan.disabled}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Instant activation</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm">30-day money back</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Headphones className="h-5 w-5 text-purple-500" />
              <span className="text-sm">Expert support</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
