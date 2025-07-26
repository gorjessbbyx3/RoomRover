
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  MapPin,
  User,
  FileText
} from 'lucide-react';
import { CleaningTaskWithDetails } from '@/lib/types';

interface TaskListProps {
  propertyId?: string;
  showOnlyAssigned?: boolean;
}

export default function TaskList({ propertyId, showOnlyAssigned = false }: TaskListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', propertyId, showOnlyAssigned ? user?.id : 'all'],
    queryFn: async () => {
      let url = '/api/tasks';
      const params = new URLSearchParams();
      
      if (propertyId) params.append('propertyId', propertyId);
      if (showOnlyAssigned && user?.id) params.append('assignedTo', user.id);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}/complete`, {
        notes,
        completedBy: user?.id
      });
      return response.json();
    },
    onSuccess: (_, { taskId }) => {
      toast({
        title: 'Task Completed',
        description: 'Task has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      setTaskNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[taskId];
        return newNotes;
      });
    },
    onError: (error: any, { taskId }) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to complete task.',
      });
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    },
  });

  const handleCompleteTask = async (task: CleaningTaskWithDetails) => {
    setCompletingTasks(prev => new Set(prev).add(task.id));
    await completeTaskMutation.mutateAsync({
      taskId: task.id,
      notes: taskNotes[task.id]
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingTasks = tasks.filter((task: CleaningTaskWithDetails) => 
    task.status !== 'completed'
  );
  const completedTasks = tasks.filter((task: CleaningTaskWithDetails) => 
    task.status === 'completed'
  );

  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-4">
            {pendingTasks.map((task: CleaningTaskWithDetails) => (
              <Card key={task.id} className="border-l-4 border-l-orange-400">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        {task.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <span>•</span>
                        <span className="capitalize">{task.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {task.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>Assigned to: {task.assignedTo}</span>
                      </div>
                    )}
                  </div>

                  {task.status !== 'completed' && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Completion Notes (Optional)
                        </label>
                        <Textarea
                          placeholder="Add any notes about task completion..."
                          value={taskNotes[task.id] || ''}
                          onChange={(e) => setTaskNotes(prev => ({
                            ...prev,
                            [task.id]: e.target.value
                          }))}
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                      <Button
                        onClick={() => handleCompleteTask(task)}
                        disabled={completingTasks.has(task.id)}
                        className="w-full"
                      >
                        {completingTasks.has(task.id) ? (
                          'Completing...'
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-4">
            {completedTasks.map((task: CleaningTaskWithDetails) => (
              <Card key={task.id} className="border-l-4 border-l-green-400 opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {task.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    {task.completedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.completedBy && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>By: {task.completedBy}</span>
                      </div>
                    )}
                  </div>
                  {task.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm text-gray-600">{task.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks</h3>
            <p className="text-gray-500">
              {showOnlyAssigned 
                ? "You don't have any assigned tasks at the moment."
                : "No tasks found for the selected criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
