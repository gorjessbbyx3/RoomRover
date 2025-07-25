
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Key, AlertCircle, CheckCircle, Edit } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  frontDoorCode: string | null;
  codeExpiry: string | null;
}

interface FrontDoorManagerProps {
  properties: Property[];
}

export default function FrontDoorManager({ properties }: FrontDoorManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [duration, setDuration] = useState('monthly');

  const updateCodeMutation = useMutation({
    mutationFn: async ({ propertyId, frontDoorCode, duration }: { propertyId: string; frontDoorCode: string; duration: string }) => {
      const response = await apiRequest('PUT', `/api/properties/${propertyId}/front-door-code`, { frontDoorCode, duration });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Front Door Code Updated',
        description: `New code ${data.frontDoorCode} set successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setDialogOpen(false);
      setNewCode('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update front door code',
      });
    },
  });

  const handleUpdateCode = () => {
    if (!selectedProperty || !newCode || newCode.length < 4) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a code with at least 4 digits.',
      });
      return;
    }

    updateCodeMutation.mutate({
      propertyId: selectedProperty.id,
      frontDoorCode: newCode,
      duration
    });
  };

  const generateRandomCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setNewCode(code);
  };

  const isCodeExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry set';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredProperties = user?.role === 'manager' && user.property 
    ? properties.filter(p => p.id === user.property)
    : properties;

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }

  return (
    <Card className="shadow-material">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Front Door Code Management
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Manage front door access codes for properties
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{property.name}</h3>
                <div className="flex items-center mt-2 space-x-4">
                  <div>
                    <span className="text-sm text-gray-500">Current Code: </span>
                    {property.frontDoorCode ? (
                      <span className="text-lg font-mono font-semibold text-gray-900">
                        {property.frontDoorCode}
                      </span>
                    ) : (
                      <span className="text-gray-400">No code set</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {property.codeExpiry && (
                      <>
                        {isCodeExpired(property.codeExpiry) ? (
                          <AlertCircle className="h-4 w-4 text-error-500 mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                        )}
                        <span className={`text-sm ${isCodeExpired(property.codeExpiry) ? 'text-error-600' : 'text-gray-600'}`}>
                          Expires: {formatDate(property.codeExpiry)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Dialog open={dialogOpen && selectedProperty?.id === property.id} onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) setSelectedProperty(property);
                if (!open) setNewCode('');
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    data-testid={`update-front-door-code-${property.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Code
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-update-front-door-code">
                  <DialogHeader>
                    <DialogTitle>Update Front Door Code - {property.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-code">Current Code</Label>
                      <Input 
                        id="current-code"
                        value={property.frontDoorCode || 'No code set'} 
                        disabled 
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="new-code">New Front Door Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="new-code"
                          type="text"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="Enter 4+ digit code"
                          className="flex-1"
                          maxLength={8}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateRandomCode}
                          data-testid="generate-random-code"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="duration">Code Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily (2 days)</SelectItem>
                          <SelectItem value="weekly">Weekly (10 days)</SelectItem>
                          <SelectItem value="monthly">Monthly (35 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setDialogOpen(false);
                          setNewCode('');
                        }}
                        data-testid="cancel-update-code"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateCode}
                        disabled={updateCodeMutation.isPending || !newCode}
                        className="bg-primary-500 hover:bg-primary-600"
                        data-testid="confirm-update-code"
                      >
                        {updateCodeMutation.isPending ? 'Updating...' : 'Update Code'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
