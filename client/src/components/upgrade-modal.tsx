
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

interface UpgradeModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const plans = [
  {
    name: "Basic",
    price: "$29",
    period: "per month",
    description: "Perfect for getting started",
    features: [
      "Up to 5 rooms",
      "Basic analytics",
      "Email support",
      "Standard cleaning tools"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$79",
    period: "per month", 
    description: "For growing businesses",
    features: [
      "Up to 25 rooms",
      "Advanced analytics",
      "Priority support",
      "AI-powered insights",
      "Custom integrations"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "per month",
    description: "For large operations",
    features: [
      "Unlimited rooms",
      "White-label solution",
      "24/7 dedicated support",
      "Advanced AI features",
      "Custom development"
    ],
    popular: false
  }
];

export default function UpgradeModal({ trigger, open, onOpenChange }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan === plan.name ? 'ring-2 ring-blue-500' : ''
              } ${plan.popular ? 'border-blue-500' : ''}`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {selectedPlan === plan.name ? (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Selected
                    </span>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {selectedPlan && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Ready to upgrade to <strong>{selectedPlan}</strong>? Contact our sales team to get started.
            </p>
            <Button className="mt-2 bg-blue-500 hover:bg-blue-600">
              Contact Sales
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
