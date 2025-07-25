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
  referralSource: z.string().min(1, 'Please provide who referred you to this site'),
  clubhouse: z.string().min(1, 'Please select a clubhouse location'),
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
      clubhouse: '',
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
            Honolulu ClubHouse
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Exclusive membership-only access to our private clubhouse in the heart of Honolulu. Experience privacy, comfort, and convenient accommodations with your membership plan.
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

        {/* Clubhouse Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* P1 ClubHouse */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">P1 - Queen ClubHouse</h2>
            <div className="grid grid-cols-1 gap-4">
              
              {/* P1 Daily */}
              <Card className="shadow-material border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-900">Daily Access</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Short-term flexibility</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $60<span className="text-sm font-medium text-gray-600">/day</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Private room access
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Secure keyless entry
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Essential amenities
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* P1 Weekly */}
              <Card className="shadow-material border border-gray-200 overflow-hidden">
                <CardHeader className="bg-primary-50 border-b border-primary-200">
                  <CardTitle className="text-lg font-semibold text-gray-900">Weekly Residency</CardTitle>
                  <p className="text-sm text-primary-600 mt-1">Popular choice</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $300<span className="text-sm font-medium text-gray-600">/week</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      All daily benefits
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Weekly housekeeping
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Priority support
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* P1 Monthly */}
              <Card className="shadow-material border-2 border-primary-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-primary-500 text-white px-2 py-1 text-xs font-medium rounded-bl-lg">
                  RECOMMENDED
                </div>
                <CardHeader className="bg-primary-500 text-white border-b border-primary-600">
                  <CardTitle className="text-lg font-semibold">Monthly Membership</CardTitle>
                  <p className="text-sm text-primary-100 mt-1">Best value</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $1200<span className="text-sm font-medium text-gray-600">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      All residency benefits
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Bi-weekly housekeeping
                    </li>
                    <li className="flex items-center">
                      <Star className="h-3 w-3 text-warning-500 mr-2 flex-shrink-0" />
                      Guaranteed availability
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* P2 ClubHouse */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">P2 - Kapahulu ClubHouse</h2>
            <div className="grid grid-cols-1 gap-4">
              
              {/* P2 Daily */}
              <Card className="shadow-material border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-900">Daily Access</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Premium location</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $100<span className="text-sm font-medium text-gray-600">/day</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Private room access
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Secure keyless entry
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Premium amenities
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* P2 Weekly */}
              <Card className="shadow-material border border-gray-200 overflow-hidden">
                <CardHeader className="bg-primary-50 border-b border-primary-200">
                  <CardTitle className="text-lg font-semibold text-gray-900">Weekly Residency</CardTitle>
                  <p className="text-sm text-primary-600 mt-1">Premium choice</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $500<span className="text-sm font-medium text-gray-600">/week</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      All daily benefits
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Weekly housekeeping
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Premium support
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* P2 Monthly */}
              <Card className="shadow-material border border-gray-200 overflow-hidden">
                <CardHeader className="bg-warning-50 border-b border-warning-200">
                  <CardTitle className="text-lg font-semibold text-gray-900">Monthly Membership</CardTitle>
                  <p className="text-sm text-warning-600 mt-1">Premium value</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      $2000<span className="text-sm font-medium text-gray-600">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      All premium benefits
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-success-500 mr-2 flex-shrink-0" />
                      Bi-weekly housekeeping
                    </li>
                    <li className="flex items-center">
                      <Star className="h-3 w-3 text-warning-500 mr-2 flex-shrink-0" />
                      Premium location perks
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
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
                    name="clubhouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ClubHouse Location *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-clubhouse">
                              <SelectValue placeholder="Select clubhouse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="p1">P1 - Queen ClubHouse</SelectItem>
                            <SelectItem value="p2">P2 - Kapahulu ClubHouse (Premium)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </div>

                <FormField
                  control={form.control}
                  name="referralSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who referred you to this site? *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter the name of who referred you to this site" 
                          {...field} 
                          data-testid="input-referral"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

        {/* Fee Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Security Deposit Required</h3>
                <p className="text-sm text-blue-700">
                  A <strong>$50 initial security deposit</strong> is required for all memberships. 
                  This deposit is refundable upon checkout and room inspection.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start">
              <div className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0">🐕</div>
              <div>
                <h3 className="font-medium text-purple-800 mb-1">Pet Fee</h3>
                <p className="text-sm text-purple-700">
                  A <strong>non-refundable $50 fee per pet</strong> applies to all pets staying 
                  in the clubhouse accommodations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
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