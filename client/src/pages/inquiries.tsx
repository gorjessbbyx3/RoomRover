
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import AutoAssignRoom from '@/components/auto-assign-room';
import { useAuth } from '@/lib/auth';
import { 
  MessageSquare, 
  Calendar,
  User,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  contact: string;
  email: string;
  referralSource: string | null;
  preferredPlan: string;
  message: string | null;
  status: string;
  trackerToken: string;
  createdAt: string;
  bookingId: string | null;
}

export default function Inquiries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
  });

  const { data: properties } = useQuery({
    queryKey: ['/api/properties'],
  });

  // Filter inquiries for managers to only show those relevant to their property
  const filteredInquiries = user?.role === 'manager' && user.property
    ? inquiries?.filter(inquiry => {
        // For managers, we'll show all inquiries but they can only assign to their property
        return true;
      })
    : inquiries;

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, status }: { inquiryId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/inquiries/${inquiryId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Inquiry Updated',
        description: 'Inquiry status updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update inquiry',
      });
    },
  });

  const handleStatusChange = (inquiryId: string, newStatus: string) => {
    updateInquiryMutation.mutate({
      inquiryId,
      status: newStatus
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTrackerUrl = (token: string) => {
    return `${window.location.origin}/tracker/${token}`;
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-primary-100 text-primary-800';
      case 'payment_confirmed':
        return 'bg-warning-100 text-warning-800';
      case 'booking_confirmed':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin or manager role required.</p>
      </div>
    );
  }

  const canManageInquiries = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Inquiry Management
          {user.role === 'manager' && user.property && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {properties?.find(p => p.id === user.property)?.name || user.property}
            </span>
          )}
        </h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'manager' 
            ? `Manage member inquiries and assign rooms for ${properties?.find(p => p.id === user.property)?.name || 'your property'}.`
            : 'Manage member inquiries and room assignments.'
          }
        </p>
      </div>

      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Member Inquiries
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Review and process member inquiries
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries?.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50" data-testid={`inquiry-row-${inquiry.id}`}>
                      <TableCell>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{inquiry.name}</div>
                            {inquiry.referralSource && (
                              <div className="text-xs text-gray-500">via {inquiry.referralSource}</div>
                            )}
                            {inquiry.message && (
                              <div className="text-xs text-gray-600 mt-1 max-w-xs truncate" title={inquiry.message}>
                                "{inquiry.message}"
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-3 w-3 mr-1" />
                            {inquiry.contact}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {inquiry.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {inquiry.preferredPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <Badge className={getStatusBadgeType(inquiry.status)}>
                              {inquiry.status.replace('_', ' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="payment_confirmed">Payment Confirmed</SelectItem>
                            <SelectItem value="booking_confirmed">Booking Confirmed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(inquiry.createdAt)}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(inquiry.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!inquiry.bookingId && inquiry.status !== 'booking_confirmed' && canManageInquiries && (
                            <AutoAssignRoom
                              inquiryId={inquiry.id}
                              inquiryName={inquiry.name}
                              onAssigned={() => queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] })}
                            />
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getTrackerUrl(inquiry.trackerToken), '_blank')}
                            className="text-primary-600 hover:text-primary-800"
                            data-testid={`view-tracker-${inquiry.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
