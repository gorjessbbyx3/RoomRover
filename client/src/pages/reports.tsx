import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { 
  AlertTriangle, 
  Package, 
  Wrench, 
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';

interface InventoryItem {
  id: string;
  propertyId: string;
  item: string;
  quantity: number;
  threshold: number;
  unit: string;
  notes: string | null;
  lastUpdated: string;
}

interface MaintenanceItem {
  id: string;
  roomId: string | null;
  propertyId: string | null;
  issue: string;
  description: string | null;
  priority: string;
  status: string;
  reportedBy: string;
  assignedTo: string | null;
  dateReported: string;
  dateCompleted: string | null;
  notes: string | null;
}

interface Payment {
  id: string;
  amount: string;
  method: string;
  dateReceived: string;
}

interface Property {
  id: string;
  name: string;
}

export default function Reports() {
  const { user } = useAuth();

  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/low-stock'],
  });

  const { data: openMaintenance, isLoading: maintenanceLoading } = useQuery<MaintenanceItem[]>({
    queryKey: ['/api/maintenance/open'],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string) => `$${parseFloat(amount).toFixed(0)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  // Calculate revenue metrics
  const totalRevenue = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyRevenue = payments?.filter(payment => {
    const paymentDate = new Date(payment.dateReceived);
    return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
  }).reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;

  const cashPayments = payments?.filter(p => p.method === 'cash').length || 0;
  const cashAppPayments = payments?.filter(p => p.method === 'cash_app').length || 0;

  // Critical issues count
  const criticalMaintenance = openMaintenance?.filter(item => item.priority === 'critical').length || 0;
  const criticalSupplies = lowStockItems?.filter(item => item.quantity === 0).length || 0;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Admin Reports
        </h1>
        <p className="text-gray-600 mt-2">
          System overview, alerts, and administrative insights.
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-material border-l-4 border-l-error-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-error-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Issues</dt>
                  <dd className="text-lg font-medium text-error-600" data-testid="stat-critical-issues">
                    {(maintenanceLoading || lowStockLoading) ? <Skeleton className="h-6 w-8" /> : (criticalMaintenance + criticalSupplies)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-warning-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-warning-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                  <dd className="text-lg font-medium text-warning-600" data-testid="stat-low-stock">
                    {lowStockLoading ? <Skeleton className="h-6 w-8" /> : lowStockItems?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-primary-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-monthly-revenue">
                    {paymentsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(monthlyRevenue.toString())}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material border-l-4 border-l-success-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-total-revenue">
                    {paymentsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(totalRevenue.toString())}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Low Stock Alerts */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-warning-600" />
                Low Stock Alerts
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Items below minimum threshold
              </p>
            </div>
            <Button size="sm" variant="outline" data-testid="button-export-inventory">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {lowStockLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => {
                  const property = properties?.find(p => p.id === item.propertyId);
                  const isOutOfStock = item.quantity === 0;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        isOutOfStock ? 'bg-error-50 border-error-200' : 'bg-warning-50 border-warning-200'
                      }`}
                      data-testid={`low-stock-item-${item.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${isOutOfStock ? 'text-error-800' : 'text-warning-800'}`}>
                              {item.item}
                            </h4>
                            <Badge 
                              variant={isOutOfStock ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {property?.name}
                            </Badge>
                          </div>
                          <div className={`text-sm ${isOutOfStock ? 'text-error-600' : 'text-warning-600'}`}>
                            Current: {item.quantity} {item.unit} (Min: {item.threshold})
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last updated: {formatDate(item.lastUpdated)}
                          </div>
                        </div>
                        <div className="text-right">
                          {isOutOfStock ? (
                            <Badge variant="destructive" className="text-xs">
                              OUT OF STOCK
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              LOW STOCK
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All inventory levels are adequate</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Maintenance Issues */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-error-600" />
                Open Maintenance
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Pending maintenance requests
              </p>
            </div>
            <Button size="sm" variant="outline" data-testid="button-export-maintenance">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {maintenanceLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : openMaintenance && openMaintenance.length > 0 ? (
              <div className="space-y-3">
                {openMaintenance.map((item) => {
                  const property = properties?.find(p => p.id === item.propertyId);
                  const isCritical = item.priority === 'critical';
                  const isHigh = item.priority === 'high';
                  
                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        isCritical ? 'bg-error-50 border-error-200' :
                        isHigh ? 'bg-warning-50 border-warning-200' :
                        'border-gray-200'
                      }`}
                      data-testid={`maintenance-item-${item.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${
                              isCritical ? 'text-error-800' :
                              isHigh ? 'text-warning-800' :
                              'text-gray-800'
                            }`}>
                              {item.issue}
                            </h4>
                            <Badge 
                              variant="outline"
                              className="text-xs"
                            >
                              {item.roomId || property?.name}
                            </Badge>
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-600 mb-1">{item.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Reported: {formatDate(item.dateReported)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              isCritical ? "destructive" :
                              isHigh ? "secondary" :
                              "outline"
                            }
                            className="text-xs capitalize"
                          >
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No open maintenance issues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card className="shadow-material">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-600" />
              Revenue Analysis
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Payment method breakdown and trends
            </p>
          </div>
          <Button size="sm" variant="outline" data-testid="button-export-revenue">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {paymentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="text-primary-800 font-medium mb-2">Payment Methods</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Cash Payments:</span>
                    <span className="font-medium text-primary-800">{cashPayments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Cash App Payments:</span>
                    <span className="font-medium text-primary-800">{cashAppPayments}</span>
                  </div>
                </div>
              </div>

              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="text-success-800 font-medium mb-2">This Month</div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-success-800">
                    {formatCurrency(monthlyRevenue.toString())}
                  </div>
                  <div className="text-sm text-success-600">
                    {payments?.filter(payment => {
                      const paymentDate = new Date(payment.dateReceived);
                      return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
                    }).length || 0} transactions
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-purple-800 font-medium mb-2">All Time</div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-800">
                    {formatCurrency(totalRevenue.toString())}
                  </div>
                  <div className="text-sm text-purple-600">
                    {payments?.length || 0} total transactions
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
