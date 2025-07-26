Replacing the original CreateListing component with a new version that includes form state management, submission handling, and integration with React Query for data mutations.
```

```replit_final_file
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CreateListingForm {
  roomNumber: string;
  description: string;
  price: string;
  capacity: string;
  amenities: string;
}

export default function CreateListing() {
  const [formData, setFormData] = useState<CreateListingForm>({
    roomNumber: '',
    description: '',
    price: '',
    capacity: '',
    amenities: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createListingMutation = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      const response = await apiRequest('POST', '/api/rooms', {
        roomNumber: data.roomNumber,
        description: data.description,
        price: parseFloat(data.price),
        capacity: parseInt(data.capacity),
        amenities: data.amenities.split(',').map(a => a.trim()),
        status: 'available',
        cleaningStatus: 'clean'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Room Created',
        description: 'Room listing has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      navigate('/rooms');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create room listing',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomNumber || !formData.description || !formData.price) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Price must be a positive number',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createListingMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateListingForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-8">Create Room Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Room Number *</label>
          <input 
            type="text" 
            value={formData.roomNumber}
            onChange={(e) => handleInputChange('roomNumber', e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter room number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea 
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-3 border rounded-lg h-32"
            placeholder="Describe the room..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Price *</label>
          <input 
            type="number" 
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter price"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Capacity</label>
          <input 
            type="number" 
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Number of people"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <input 
            type="text" 
            value={formData.amenities}
            onChange={(e) => handleInputChange('amenities', e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="WiFi, AC, Private Bath (comma separated)"
          />
        </div>
        <button 
          type="submit"
          disabled={isSubmitting || createListingMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}