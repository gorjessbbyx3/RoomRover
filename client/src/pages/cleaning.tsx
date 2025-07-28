import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import StatusBadge from '@/components/status-badge';
import { useAuth } from '@/lib/auth';
import { 
  Plus, 
  Fan, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';
import { useState } from 'react';

interface CleaningTask {
  id: string;
  roomId: string | null;
  propertyId: string | null;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
  createdAt: string;
}

interface Room {
  id: string;
  propertyId: string;
  roomNumber: number;
  status: string;
}

interface Property {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const taskSchema = z.object({
  roomId: z.string().optional(),
  propertyId: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.string().min(1, 'Priority is required'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function Cleaning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleaning-tasks'],
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin',
  });

  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      roomId: '',
      propertyId: '',
      type: 'room_cleaning',
      title: '',
      description: '',
      priority: 'normal',
      assignedTo: '',
      dueDate: '',
      notes: '',
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await apiRequest('POST', '/api/cleaning-tasks', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Task Created',
        description: 'Cleaning task created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cleaning-tasks'] });
      setTaskDialogOpen(false);
      taskForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create task',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<CleaningTask> }) => {
      const response = await apiRequest('PUT', `/api/cleaning-tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Task Updated',
        description: 'Task status updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cleaning-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update task',
      });
    },
  });

  const onSubmitTask = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleCompleteTask = (taskId: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: 'completed' }
    }, {
      onSuccess: () => {
        console.log('Task completed successfully');
      },
      onError: (error) => {
        console.error('Failed to complete task:', error);
        // Show user-friendly error message
      }
    });
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus }
    }, {
      onSuccess: () => {
        console.log('Task status updated successfully');
      },
      onError: (error) => {
        console.error('Failed to update task status:', error);
        // Show user-friendly error message
      }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'room_cleaning':
        return 'Room Cleaning';
      case 'linen_change':
        return 'Linen Change';
      case 'common_area':
        return 'Common Area';
      case 'trash_pickup':
        return 'Trash Pickup';
      default:
        return type;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const pendingTasks = tasks?.filter(task => task.status === 'pending') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  const canCreateTasks = user?.role === 'admin' || user?.role === 'manager';
  const canCompleteAllTasks = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'helper';

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          Cleaning Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage cleaning tasks and schedules for {user.property || 'all properties'}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-warning-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-pending-tasks">
                    {tasksLoading ? <Skeleton className="h-6 w-8" /> : pendingTasks.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Fan className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-in-progress-tasks">
                    {tasksLoading ? <Skeleton className="h-6 w-8" /> : inProgressTasks.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                  <dd className="text-lg font-medium text-gray-900" data-testid="stat-completed-tasks">
                    {tasksLoading ? <Skeleton className="h-6 w-8" /> : completedTasks.filter(task => {
                      const today = new Date().toDateString();
                      return task.completedAt && new Date(task.completedAt).toDateString() === today;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending & In Progress Tasks */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                Active Tasks
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Pending and in-progress cleaning tasks
              </p>
            </div>
            {canCreateTasks && (
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary-500 hover:bg-primary-600" data-testid="button-add-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="dialog-add-task">
                  <DialogHeader>
                    <DialogTitle>Create Cleaning Task</DialogTitle>
                  </DialogHeader>
                  <Form {...taskForm}>
                    <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="room_cleaning">Room Cleaning</SelectItem>
                                  <SelectItem value="linen_change">Linen Change</SelectItem>
                                  <SelectItem value="common_area">Common Area</SelectItem>
                                  <SelectItem value="trash_pickup">Trash Pickup</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={taskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter task title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="roomId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Room (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select room" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {rooms?.map((room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                      {room.id} (Room {room.roomNumber})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="propertyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select property" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {properties?.map((property) => (
                                    <SelectItem key={property.id} value={property.id}>
                                      {property.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="assignedTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign To</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users?.map((assignee) => (
                                    <SelectItem key={assignee.id} value={assignee.id}>
                                      {assignee.name} ({assignee.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={taskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Task details and requirements..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setTaskDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTaskMutation.isPending}
                          className="bg-primary-500 hover:bg-primary-600"
                        >
                          {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {tasksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : [...pendingTasks, ...inProgressTasks].length > 0 ? (
              <div className="space-y-4">
                {[...pendingTasks, ...inProgressTasks].map((task) => (
                  <div 
                    key={task.id}
                    className={`border rounded-lg p-4 ${
                      task.priority === 'critical' ? 'bg-error-50 border-error-200' :
                      task.priority === 'high' ? 'bg-warning-50 border-warning-200' :
                      'border-gray-200'
                    }`}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPriorityIcon(task.priority)}
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <StatusBadge status={task.status} type="task" />
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{getTaskTypeLabel(task.type)}</span>
                          {task.roomId && <span> • Room {task.roomId}</span>}
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(task.dueDate)}</span>
                          {task.assignedTo && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <StatusBadge status={task.priority} type="priority" />

                        {canCompleteAllTasks && (
                          <div className="flex space-x-1">
                            {task.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                className="text-xs"
                                data-testid={`button-start-task-${task.id}`}
                              >
                                Start
                              </Button>
                            )}

                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCompleteTask(task.id)}
                              className="text-success-600 hover:text-success-800"
                              data-testid={`button-complete-task-${task.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Fan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active cleaning tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Tasks */}
        <Card className="shadow-material">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900">
              Recently Completed
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Tasks completed in the last 7 days
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {tasksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : completedTasks.length > 0 ? (
              <div className="space-y-3">
                {completedTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="border border-success-200 rounded-lg p-3 bg-success-50"
                    data-testid={`completed-task-${task.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-success-800">{task.title}</h4>
                        <div className="text-sm text-success-600">
                          <span>{getTaskTypeLabel(task.type)}</span>
                          {task.roomId && <span> • {task.roomId}</span>}
                        </div>
                        <div className="text-xs text-success-600 mt-1">
                          Completed {formatDateTime(task.completedAt)}
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-success-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No completed tasks yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}