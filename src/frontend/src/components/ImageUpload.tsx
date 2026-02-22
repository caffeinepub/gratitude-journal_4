import { useRef } from 'react';
import { Button } from './ui/button';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { useState } from 'react';

interface ImageUploadProps {
  images: ExternalBlob[];
  onChange: (images: ExternalBlob[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({ images, onChange, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ExternalBlob[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const tempId = `temp-${Date.now()}-${i}`;
      
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress((prev) => ({ ...prev, [tempId]: percentage }));
      });

      newImages.push(blob);
    }

    onChange([...images, ...newImages]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear progress after a delay
    setTimeout(() => setUploadProgress({}), 1000);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-full"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Add Images
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => {
            const url = image.getDirectURL();
            const progress = Object.values(uploadProgress)[index];
            
            return (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {progress !== undefined && progress < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
