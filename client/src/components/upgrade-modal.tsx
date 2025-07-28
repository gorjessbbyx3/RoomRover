
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

export default function UpgradeModal({ trigger, open, onOpenChange }: UpgradeModalProps)
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


