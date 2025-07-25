import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Package, Wrench, DollarSign, Bed, Users, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Reports() {
  const { user } = useAuth();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required to view reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load reports. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      clean: 'bg-green-100 text-green-800',
      dirty: 'bg-red-100 text-red-800',
      fresh: 'bg-green-100 text-green-800',
      used: 'bg-yellow-100 text-yellow-800',
      needs_replacement: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Comprehensive Reports</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <Eye className="h-4 w-4 mr-1" />
          Last updated: {new Date(report.dataQuality.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {report.summary.criticalAlerts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {report.summary.lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {report.summary.openMaintenanceCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${report.summary.monthlyRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Low Stock Items ({report.details.lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.details.lowStockItems.length === 0 ? (
              <p className="text-muted-foreground">All items are well stocked</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.lowStockItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{item.propertyId}</TableCell>
                      <TableCell>
                        <span className={item.quantity === 0 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                          {item.quantity} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell>{item.threshold} {item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Open Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Open Maintenance ({report.details.openMaintenance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.details.openMaintenance.length === 0 ? (
              <p className="text-muted-foreground">No open maintenance items</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Days Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.openMaintenance.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.issue}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(item.priority)}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.propertyId || item.roomId}</TableCell>
                      <TableCell>
                        {Math.floor((new Date().getTime() - new Date(item.dateReported).getTime()) / (1000 * 60 * 60 * 24))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pending Payments ({report.details.pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.details.pendingPayments.length === 0 ? (
              <p className="text-muted-foreground">All payments are up to date</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.pendingPayments.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.roomId}</TableCell>
                      <TableCell>{booking.plan}</TableCell>
                      <TableCell>${parseFloat(booking.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Cleaning Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bed className="h-5 w-5 mr-2" />
              Cleaning Issues ({report.details.cleaningIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.details.cleaningIssues.length === 0 ? (
              <p className="text-muted-foreground">All rooms are clean and ready</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Cleaning</TableHead>
                    <TableHead>Linen</TableHead>
                    <TableHead>Last Cleaned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.cleaningIssues.map((room: any) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.id}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(room.cleaningStatus)}>
                          {room.cleaningStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(room.linenStatus)}>
                          {room.linenStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {room.lastCleaned ? new Date(room.lastCleaned).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inquiry Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Inquiry Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.details.inquirySummary).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold">{count as number}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Alerts */}
      {(report.dataQuality.staleInventory.length > 0 || report.dataQuality.staleMaintenance.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Data Quality Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.dataQuality.staleInventory.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {report.dataQuality.staleInventory.length} inventory items haven't been updated in over 7 days
                </AlertDescription>
              </Alert>
            )}
            {report.dataQuality.staleMaintenance.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {report.dataQuality.staleMaintenance.length} maintenance items have been open for over 7 days
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}