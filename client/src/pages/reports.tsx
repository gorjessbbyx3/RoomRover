
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { 
  AlertTriangle, 
  Package, 
  Wrench, 
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  Users,
  Home,
  Key,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ReportsData {
  summary: {
    criticalAlerts: number;
    lowStockCount: number;
    openMaintenanceCount: number;
    nonCompliantBookingsCount: number;
    pendingPaymentsCount: number;
    cleaningIssuesCount: number;
    monthlyRevenue: number;
    totalRevenue: number;
  };
  details: {
    lowStockItems: any[];
    openMaintenance: any[];
    nonCompliantBookings: any[];
    pendingPayments: any[];
    overduePayments: any[];
    inquirySummary: Record<string, number>;
    cleaningIssues: any[];
    expiredCodes: any[];
    properties: any[];
  };
  dataQuality: {
    staleInventory: any[];
    staleMaintenance: any[];
    lastUpdated: string;
  };
}

export default function Reports() {
  const { user } = useAuth();

  const { data: reportsData, isLoading, refetch } = useQuery<ReportsData>({
    queryKey: ['/api/reports'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view system reports.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-error-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Generation Failed</h1>
          <p className="text-gray-600 mb-4">Unable to load system reports.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { summary, details, dataQuality } = reportsData;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              System Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive oversight and compliance monitoring
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {formatDate(dataQuality.lastUpdated)}
        </div>
      </div>

      {/* Data Quality Alerts */}
      {(dataQuality.staleInventory.length > 0 || dataQuality.staleMaintenance.length > 0) && (
        <Alert className="mb-6 border-warning-200 bg-warning-50">
          <AlertCircle className="h-4 w-4 text-warning-600" />
          <AlertDescription className="text-warning-800">
            <strong>Data Quality Warning:</strong> {dataQuality.staleInventory.length} inventory items and {dataQuality.staleMaintenance.length} maintenance records are over 7 days old.
          </AlertDescription>
        </Alert>
      )}

      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <Card className="shadow-material border-l-4 border-l-error-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Critical</p>
                <p className="text-2xl font-bold text-error-600" data-testid="stat-critical-alerts">
                  {summary.criticalAlerts}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-error-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-warning-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock</p>
                <p className="text-2xl font-bold text-warning-600">
                  {summary.lowStockCount}
                </p>
              </div>
              <Package className="h-8 w-8 text-warning-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-error-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Repairs</p>
                <p className="text-2xl font-bold text-error-600">
                  {summary.openMaintenanceCount}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-error-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-warning-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill 41</p>
                <p className="text-2xl font-bold text-warning-600">
                  {summary.nonCompliantBookingsCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-warning-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-warning-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-warning-600">
                  {summary.pendingPaymentsCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-warning-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cleaning</p>
                <p className="text-2xl font-bold text-warning-600">
                  {summary.cleaningIssuesCount}
                </p>
              </div>
              <Home className="h-8 w-8 text-warning-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-primary-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(summary.monthlyRevenue)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-success-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="space-y-6">
        {/* Bill 41 Compliance */}
        {details.nonCompliantBookings.length > 0 && (
          <Card className="shadow-material border-error-200">
            <CardHeader className="border-b border-gray-200 bg-error-50">
              <CardTitle className="text-lg font-medium text-error-800 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Bill 41 Compliance Issues
              </CardTitle>
              <p className="text-sm text-error-600 mt-1">
                Bookings under 30 days (potential violations)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Booking ID</TableHead>
                      <TableHead className="min-w-[80px]">Room</TableHead>
                      <TableHead className="min-w-[100px]">Guest</TableHead>
                      <TableHead className="min-w-[80px]">Days</TableHead>
                      <TableHead className="min-w-[80px]">Plan</TableHead>
                      <TableHead className="min-w-[100px]">Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.nonCompliantBookings.map((booking) => {
                      const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                          <TableCell>{booking.roomId}</TableCell>
                          <TableCell className="truncate max-w-[100px]">{booking.guestId}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              {days} days
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{booking.plan}</TableCell>
                          <TableCell className="text-xs">{formatDate(booking.startDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inquiry Status Summary */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary-600" />
              Inquiry Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(details.inquirySummary).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Issues */}
        {(details.pendingPayments.length > 0 || details.overduePayments.length > 0) && (
          <Card className="shadow-material border-warning-200">
            <CardHeader className="border-b border-gray-200 bg-warning-50">
              <CardTitle className="text-lg font-medium text-warning-800 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payment Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...details.pendingPayments, ...details.overduePayments].map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                        <TableCell>{booking.roomId}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={booking.paymentStatus === 'overdue' ? 'destructive' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(booking.totalAmount))}</TableCell>
                        <TableCell className="capitalize">{booking.plan}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cleaning and Linen Issues */}
        {details.cleaningIssues.length > 0 && (
          <Card className="shadow-material border-warning-200">
            <CardHeader className="border-b border-gray-200 bg-warning-50">
              <CardTitle className="text-lg font-medium text-warning-800 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Cleaning & Linen Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Cleaning Status</TableHead>
                      <TableHead>Linen Status</TableHead>
                      <TableHead>Last Cleaned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.cleaningIssues.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>{room.id}</TableCell>
                        <TableCell>{room.propertyId}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={room.cleaningStatus === 'clean' ? 'default' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {room.cleaningStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={room.linenStatus === 'fresh' ? 'default' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {room.linenStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {room.lastCleaned ? formatDate(room.lastCleaned) : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired Door Codes */}
        {details.expiredCodes.length > 0 && (
          <Card className="shadow-material border-error-200">
            <CardHeader className="border-b border-gray-200 bg-error-50">
              <CardTitle className="text-lg font-medium text-error-800 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Expired Door Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Expired</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.expiredCodes.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>{room.id}</TableCell>
                        <TableCell>{room.propertyId}</TableCell>
                        <TableCell className="font-mono">{room.doorCode}</TableCell>
                        <TableCell className="text-xs text-error-600">
                          {formatDate(room.codeExpiry)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            EXPIRED
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Items */}
        {details.lowStockItems.length > 0 && (
          <Card className="shadow-material border-warning-200">
            <CardHeader className="border-b border-gray-200 bg-warning-50">
              <CardTitle className="text-lg font-medium text-warning-800 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.lowStockItems.map((item) => {
                      const property = details.properties.find(p => p.id === item.propertyId);
                      const isOutOfStock = item.quantity === 0;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{property?.name || item.propertyId}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={isOutOfStock ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {item.quantity} {item.unit}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.threshold} {item.unit}</TableCell>
                          <TableCell className="text-xs">{formatDate(item.lastUpdated)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open Maintenance */}
        {details.openMaintenance.length > 0 && (
          <Card className="shadow-material border-error-200">
            <CardHeader className="border-b border-gray-200 bg-error-50">
              <CardTitle className="text-lg font-medium text-error-800 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Open Maintenance Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Room/Property</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Days Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.openMaintenance.map((item) => {
                      const daysOpen = Math.ceil((new Date().getTime() - new Date(item.dateReported).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{item.issue}</TableCell>
                          <TableCell>{item.roomId || item.propertyId}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.priority === 'critical' ? 'destructive' :
                                item.priority === 'high' ? 'secondary' : 'outline'
                              }
                              className="text-xs capitalize"
                            >
                              {item.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(item.dateReported)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={daysOpen > 7 ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {daysOpen} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
