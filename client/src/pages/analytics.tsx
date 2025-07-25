
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  revenue: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    projections: {
      nextMonth: number;
      confidence: number;
    };
  };
  occupancy: {
    current: number;
    trend: number;
    peakTimes: string[];
    seasonalPatterns: any[];
  };
  customerInsights: {
    averageStayLength: number;
    repeatCustomerRate: number;
    referralSources: Array<{source: string; count: number; conversion: number}>;
    satisfaction: number;
  };
  operationalEfficiency: {
    cleaningTime: number;
    maintenanceResponse: number;
    bookingToCheckin: number;
    alerts: Array<{type: string; message: string; severity: 'low' | 'medium' | 'high'}>;
  };
  marketIntelligence: {
    competitorRates: Array<{competitor: string; rate: number; occupancy: number}>;
    demandForecast: number[];
    priceOptimization: Array<{period: string; suggestedRate: number; expectedRevenue: number}>;
  };
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue Intelligence</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Trends</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="market">Market Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Revenue Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${analytics?.revenue.projections.nextMonth.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">
                  {analytics?.revenue.projections.confidence}% confidence
                </p>
              </CardContent>
            </Card>
            {/* Add more revenue cards */}
          </div>
          
          {/* Revenue chart would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend & Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Advanced revenue charts with ML predictions would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.occupancy.current}%
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  {analytics?.occupancy.trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  {Math.abs(analytics?.occupancy.trend || 0)}% vs last period
                </div>
              </CardContent>
            </Card>
            {/* Add more occupancy insights */}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Repeat Customer Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analytics?.customerInsights.repeatCustomerRate}%
                </div>
              </CardContent>
            </Card>
            {/* Add customer satisfaction, referral tracking, etc. */}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Cleaning Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics?.operationalEfficiency.cleaningTime} min
                </div>
              </CardContent>
            </Card>
            {/* Add operational efficiency metrics */}
          </div>

          {/* Operational alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Operational Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics?.operationalEfficiency.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <span>{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.marketIntelligence.priceOptimization.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{rec.period}</span>
                      <p className="text-sm text-gray-500">Expected revenue: ${rec.expectedRevenue}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">${rec.suggestedRate}</div>
                      <p className="text-sm text-gray-500">per night</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
