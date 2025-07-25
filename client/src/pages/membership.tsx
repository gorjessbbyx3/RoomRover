import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { 
  Shield, 
  Wifi, 
  Bell, 
  Star,
  Check,
  Send
} from 'lucide-react';

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().min(10, 'Phone number is required (minimum 10 digits)'),
  email: z.string().email('Please enter a valid email address'),
  referralSource: z.string().min(1, 'Please tell us how you heard about this page'),
  preferredPlan: z.string().min(1, 'Please select a membership plan'),
  message: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

export default function Membership() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      contact: '',
      email: '',
      referralSource: '',
      preferredPlan: 'monthly',
      message: '',
    },
  });

  const submitInquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const response = await apiRequest('POST', '/api/inquiries', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Inquiry Submitted',
        description: `Your membership request has been received. IMPORTANT: Save this tracking token for your records: ${data.trackerToken}`,
        duration: 10000,
      });

      // Redirect to tracker page
      setTimeout(() => {
        setLocation(`/tracker/${data.trackerToken}`);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit inquiry',
      });
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    submitInquiryMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Honolulu Private Residency Club
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Exclusive membership-based accommodations in the heart of Honolulu. Experience privacy, comfort, and convenience with our carefully curated residential properties.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary-500 mr-2" />
                Secure & Private
              </div>
              <div className="flex items-center">
                <Wifi className="h-5 w-5 text-primary-500 mr-2" />
                High-Speed WiFi
              </div>
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-primary-500 mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {/* Daily Access */}
          <Card className="shadow-material border border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">Daily Access</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Short-term flexibility</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  <span className="text-lg">Starting at</span><br />
                  $60<span className="text-lg font-medium text-gray-600">/day</span>
                </div>
                <p className="text-sm text-gray-500">Premium locations from $100/day</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Private room access
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Secure keyless entry
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Essential amenities
                </li>
              </ul>
              <div className="mt-6 text-xs text-gray-400 text-center">
                *Subject to availability
              </div>
            </CardContent>
          </Card>

          {/* Weekly Residency */}
          <Card className="shadow-material border border-gray-200 overflow-hidden">
            <CardHeader className="bg-primary-50 border-b border-primary-200">
              <CardTitle className="text-lg font-semibold text-gray-900">Weekly Residency</CardTitle>
              <p className="text-sm text-primary-600 mt-1">Popular choice</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  <span className="text-lg">Starting at</span><br />
                  $300<span className="text-lg font-medium text-gray-600">/week</span>
                </div>
                <p className="text-sm text-gray-500">Premium locations from $500/week</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  All daily access benefits
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Weekly housekeeping
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Extended stay benefits
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Monthly Membership */}
          <Card className="shadow-material border-2 border-primary-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              RECOMMENDED
            </div>
            <CardHeader className="bg-primary-500 text-white border-b border-primary-600">
              <CardTitle className="text-lg font-semibold">Monthly Membership</CardTitle>
              <p className="text-sm text-primary-100 mt-1">Best value & compliance</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  <span className="text-lg">Starting at</span><br />
                  $1200<span className="text-lg font-medium text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">Premium locations from $2000/month</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  All residency benefits
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Bi-weekly housekeeping
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Premium member support
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                  Long-term resident perks
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 text-warning-500 mr-3 flex-shrink-0" />
                  Guaranteed availability
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Inquiry Form */}
        <Card className="shadow-material-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Request Membership Information
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Submit your inquiry and we'll provide you with availability and next steps.
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="membership-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} data-testid="input-contact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="preferredPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Membership *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-plan">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily Access</SelectItem>
                            <SelectItem value="weekly">Weekly Residency</SelectItem>
                            <SelectItem value="monthly">Monthly Membership (Recommended)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about this page? *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Tell us how you found out about this page" 
                            {...field} 
                            data-testid="input-referral"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4}
                          placeholder="Any specific requirements or questions? Please indicate if you will be paying with cash or Cash App ($cashapp)." 
                          {...field} 
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Your information is kept strictly confidential
                  </div>
                  <Button 
                    type="submit" 
                    disabled={submitInquiryMutation.isPending}
                    className="bg-primary-500 hover:bg-primary-600 shadow-material px-8 py-3"
                    data-testid="button-submit-inquiry"
                  >
                    {submitInquiryMutation.isPending ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-pulse" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tracking Access Link */}
        <Card className="shadow-material mt-8">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Already Submitted an Inquiry?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">
              If you've already submitted a membership request and have your tracking token, you can check your status here.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                const token = prompt('Please enter your tracking token:');
                if (token && token.trim()) {
                  setLocation(`/tracker/${token.trim()}`);
                } else if (token === '') {
                  toast({
                    variant: 'destructive',
                    title: 'Token Required',
                    description: 'Please enter a valid tracking token.',
                  });
                }
              }}
              className="w-full sm:w-auto"
            >
              Track My Request Status
            </Button>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <div className="mt-8 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-warning-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-warning-800 mb-1">Important: Save Your Tracking Token</h3>
              <p className="text-sm text-warning-700">
                After submitting your membership request, you'll receive a unique tracking token. 
                <strong> Please save this token</strong> as you'll need it to check your membership status 
                if you close your browser or need to return later.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; 2024 Honolulu Private Residency Club. All rights reserved.</p>
          <p className="mt-2">Exclusive membership-based accommodations in Honolulu, Hawaii</p>
        </div>
      </div>
    </div>
  );
}