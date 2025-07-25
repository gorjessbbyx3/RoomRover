import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { InquiryStatus } from '@/lib/types';
import { 
  Check, 
  Clock, 
  Key, 
  RefreshCw,
  Phone,
  AlertCircle,
  Info
} from 'lucide-react';

interface TrackerProps {
  params: {
    token: string;
  };
}

export default function Tracker({ params }: TrackerProps) {
  const { toast } = useToast();
  const { token } = params;

  const { data: inquiry, isLoading, error, refetch } = useQuery<InquiryStatus>({
    queryKey: ['/api/inquiries/track', token],
    queryFn: async () => {
      const response = await fetch(`/api/inquiries/track/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inquiry status');
      }
      return response.json();
    },
    retry: false,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Status Updated',
      description: 'Refreshed your membership request status.',
    });
  };

  const getStepStatus = (stepStatus: string, currentStatus: string) => {
    const statusOrder = ['received', 'payment_confirmed', 'booking_confirmed'];
    const stepIndex = statusOrder.indexOf(stepStatus);
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (stepIndex <= currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex + 1) {
      return 'pending';
    } else {
      return 'waiting';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4 shadow-material-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4 shadow-material-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-error-600 flex items-center">
              <AlertCircle className="h-6 w-6 mr-2" />
              Tracking Not Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'Unable to load tracking information. This link may have expired or is invalid.'}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                If you believe this is an error, please contact us for assistance.
              </p>
              <Button 
                onClick={() => window.location.href = '/membership'}
                className="bg-primary-500 hover:bg-primary-600"
                data-testid="button-return-membership"
              >
                Return to Membership Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inquiry) {
    return null;
  }

  const steps = [
    {
      id: 'received',
      title: 'Request Received',
      description: 'Your membership inquiry has been received and is being reviewed.',
      icon: Check,
    },
    {
      id: 'payment_confirmed',
      title: 'Payment Confirmation',
      description: 'Awaiting payment verification. You will be contacted with payment instructions.',
      icon: Clock,
    },
    {
      id: 'booking_confirmed',
      title: 'Booking Confirmed',
      description: 'Your room assignment and access codes will be provided here once payment is confirmed.',
      icon: Key,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
            Membership Request Status
          </h1>
          <p className="text-gray-600">
            Track your request progress below
          </p>
          <div className="mt-3 text-sm text-gray-500">
            Request ID: <Badge variant="outline" className="font-mono ml-1" data-testid="request-id">{inquiry.id}</Badge>
          </div>
        </div>

        {/* Status Tracker */}
        <Card className="shadow-material-lg mb-8">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Membership Request Progress
                </CardTitle>
                <p className="text-gray-600 mt-2">Your request is being processed</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                className="flex items-center space-x-2"
                data-testid="button-refresh-status"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Status</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              {steps.map((step, index) => {
                const stepStatus = getStepStatus(step.id, inquiry.status);
                const Icon = step.icon;
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} data-testid={`step-${step.id}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 relative">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${stepStatus === 'completed' ? 'bg-success-500' : 
                            stepStatus === 'pending' ? 'bg-warning-500' : 'bg-gray-300'}
                        `}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {!isLast && (
                          <div className={`
                            absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8
                            ${stepStatus === 'completed' ? 'bg-success-300' : 'bg-gray-300'}
                          `} />
                        )}
                      </div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`
                            text-lg font-medium
                            ${stepStatus === 'completed' ? 'text-gray-900' : 
                              stepStatus === 'pending' ? 'text-gray-900' : 'text-gray-500'}
                          `}>
                            {step.title}
                          </h3>
                          <span className={`
                            text-sm
                            ${stepStatus === 'completed' ? 'text-success-600' : 
                              stepStatus === 'pending' ? 'text-warning-600' : 'text-gray-500'}
                          `}>
                            {stepStatus === 'completed' ? 'Completed' : 
                             stepStatus === 'pending' ? 'In Progress' : 'Waiting'}
                          </span>
                        </div>
                        <p className={`
                          text-sm
                          ${stepStatus === 'completed' ? 'text-gray-700' : 
                            stepStatus === 'pending' ? 'text-gray-700' : 'text-gray-500'}
                        `}>
                          {step.description}
                        </p>

                        {/* Special content for payment step */}
                        {step.id === 'payment_confirmed' && stepStatus === 'pending' && (
                          <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                            <p className="text-sm text-warning-700 flex items-start">
                              <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                              We accept cash or Cash App payments. Instructions will be provided via your preferred contact method.
                            </p>
                          </div>
                        )}

                        {/* Access codes for confirmed booking */}
                        {step.id === 'booking_confirmed' && inquiry.status === 'booking_confirmed' && inquiry.booking && (
                          <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
                            <h4 className="font-medium text-success-800 mb-3">Your Access Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-success-800">Room Assignment</p>
                                <p className="text-lg font-mono text-success-900" data-testid="room-assignment">
                                  {inquiry.booking.roomId}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-success-800">Stay Dates</p>
                                <p className="text-sm text-success-700">
                                  {formatDate(inquiry.booking.startDate)} - {formatDate(inquiry.booking.endDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-success-800">Room Code</p>
                                <p className="text-2xl font-mono font-bold text-success-900" data-testid="room-code">
                                  {inquiry.booking.doorCode}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-success-800">Front Door Code</p>
                                <p className="text-2xl font-mono font-bold text-success-900" data-testid="front-door-code">
                                  {inquiry.booking.frontDoorCode}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                              <p className="text-sm text-primary-700 flex items-start">
                                <Key className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                Please save these codes securely. You will need them to access your room and the building.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-4 w-4 mr-2" />
                Questions? Contact us for assistance.
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                className="text-primary-600 hover:text-primary-800"
                data-testid="button-refresh-status-footer"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 Honolulu Private Residency Club. All rights reserved.</p>
          <p className="mt-1">Exclusive membership-based accommodations in Honolulu, Hawaii</p>
        </div>
      </div>
    </div>
  );
}
