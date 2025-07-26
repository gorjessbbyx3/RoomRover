
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardStatCard from '@/components/dashboard-stat-card';
import TaskList from '@/components/task-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Calendar
} from 'lucide-react';
import { useState } from 'react';

export default function HelperDashboard() {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['helper-stats', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/helper/stats/${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const handleClockToggle = () => {
    if (isClockedIn) {
      // Clock out
      setIsClockedIn(false);
      setClockInTime(null);
    } else {
      // Clock in
      setIsClockedIn(true);
      setClockInTime(new Date());
    }
  };

  const getWorkingTime = () => {
    if (!clockInTime) return '0h 0m';
    
    const now = new Date();
    const diff = now.getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (statsLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Helper Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your task overview...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Helper Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}. Here are your assigned tasks and work status.
        </p>
      </div>

      {/* Time Tracker Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isClockedIn ? "default" : "secondary"}>
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </Badge>
                {isClockedIn && (
                  <span className="text-sm text-gray-600">
                    Working time: {getWorkingTime()}
                  </span>
                )}
              </div>
              {clockInTime && (
                <p className="text-sm text-gray-500">
                  Started at: {clockInTime.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              onClick={handleClockToggle}
              variant={isClockedIn ? "destructive" : "default"}
              size="lg"
            >
              {isClockedIn ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Clock Out
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Clock In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardStatCard
          title="My Tasks Today"
          value={stats?.todayTasks || 0}
          subtitle="Assigned to you"
          icon={ClipboardList}
          badge={{
            text: "Active",
            variant: "default"
          }}
        />
        
        <DashboardStatCard
          title="Completed Today"
          value={stats?.completedToday || 0}
          subtitle="Tasks finished"
          icon={CheckCircle}
          trend={{
            value: 12,
            label: "efficiency rate",
            isPositive: true
          }}
        />
        
        <DashboardStatCard
          title="Priority Tasks"
          value={stats?.priorityTasks || 0}
          subtitle="High priority items"
          icon={AlertCircle}
          badge={stats?.priorityTasks > 3 ? {
            text: "Urgent",
            variant: "destructive"
          } : undefined}
        />
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList showOnlyAssigned={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.todaySchedule?.length > 0 ? (
                stats.todaySchedule.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.time}</div>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No scheduled tasks for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
