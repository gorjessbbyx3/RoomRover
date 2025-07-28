import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Check } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  maxSize?: number; // in MB
  accept?: string;
}

export default function ImageUploader({ 
  onImageUploaded, 
  maxSize = 5,
  accept = "image/*" 
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Successful',
        description: 'Image has been uploaded successfully.',
      });
      onImageUploaded(data.imageUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select an image file.',
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `File size must be less than ${maxSize}MB.`,
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload for now - replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));

        setUploadProgress(100);

        // Mock uploaded URL
        const mockUrl = URL.createObjectURL(selectedFile);
        setUploadedUrl(mockUrl);
        onImageUploaded(mockUrl);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error: any) {
        setUploadError(error.message || 'Upload failed');
        toast({
          variant: "destructive",
          title: "Upload Failed", 
          description: "Failed to upload image. Please try again.",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-48 mx-auto rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Click to select an image</p>
            <p className="text-sm text-gray-400">Max size: {maxSize}MB</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Image
        </Button>

        {selectedFile && (
          <Button 
            onClick={handleUpload}
            disabled={isUploading || uploadMutation.isPending}
            className="flex-1"
          >
            {isUploading || uploadMutation.isPending ? 'Uploading...' : 'Upload Image'}
          </Button>
        )}
      </div>
    </div>
  );
}