import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera, Crown } from 'lucide-react';
import ImageUploader from '@/components/image-uploader';
import MembershipBadge from '@/components/membership-badge';
import UpgradeModal from '@/components/upgrade-modal';
import CountdownTimer from '@/components/countdown-timer';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: ''
  });
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      if (!user) throw new Error('User not authenticated');

      const response = await apiRequest('PUT', `/api/users/${user.id}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
      });
    },
  });

  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors below before saving.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync(formData);
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-8 w-8" />
          Profile Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Update your personal information and account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="w-full">
                <Label>Profile Picture</Label>
                <ImageUploader 
                  onImageUploaded={setProfilePicture}
                  maxSize={2}
                  accept="image/*"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                required
                className={validationErrors.email ? 'border-red-500' : ''}
              />
               {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div className="pt-4">
              <Button 
                type="submit"
                disabled={isLoading || updateProfileMutation.isPending || !hasUnsavedChanges}
                className="w-full"
                variant={hasUnsavedChanges ? "default" : "secondary"}
              >
                {isLoading || updateProfileMutation.isPending ? 'Saving Changes...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
              </Button>
              {hasUnsavedChanges && (
                <p className="text-amber-600 text-sm text-center mt-2">
                  You have unsaved changes
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Membership Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MembershipBadge tier={user.membership?.tier || 'free'} />
                <div>
                  <p className="font-medium">
                    {user.membership?.tier === 'premium' ? 'Premium Member' :
                     user.membership?.tier === 'pro' ? 'Pro Member' : 'Free Member'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {user.membership?.status || 'active'}
                  </p>
                </div>
              </div>
              
              {user.membership?.tier !== 'premium' && (
                <UpgradeModal 
                  trigger={
                    <Button variant="outline" size="sm">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  }
                />
              )}
            </div>

            {user.membership?.expires_at && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Membership expires:</span>
                <CountdownTimer expiresAt={user.membership.expires_at} />
              </div>
            )}

            {user.membership?.started_at && (
              <div className="text-sm text-gray-500">
                Member since: {new Date(user.membership.started_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

