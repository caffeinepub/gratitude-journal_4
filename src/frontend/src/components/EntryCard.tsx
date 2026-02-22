import { useState, useRef } from 'react';
import { JournalEntry, ExternalBlob } from '../backend';
import { useUpdateEntry, useDeleteEntry, useAddImagesToEntry, useRemovePhotoFromEntry } from '../hooks/useQueries';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Edit2, Trash2, Save, X, ImagePlus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface EntryCardProps {
  entry: JournalEntry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [photoToDelete, setPhotoToDelete] = useState<ExternalBlob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const addImages = useAddImagesToEntry();
  const removePhoto = useRemovePhotoFromEntry();

  const handleSave = async () => {
    if (editText.trim() && editText !== entry.text) {
      await updateEntry.mutateAsync({ id: entry.id, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(entry.text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteEntry.mutateAsync(entry.id);
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ExternalBlob[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      newImages.push(blob);
    }

    if (newImages.length > 0) {
      await addImages.mutateAsync({ id: entry.id, images: newImages });
    }

    // Clear input and progress
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleRemovePhoto = async () => {
    if (!photoToDelete) return;
    await removePhoto.mutateAsync({ entryId: entry.id, photoBlob: photoToDelete });
    setPhotoToDelete(null);
  };

  // Format timestamp
  const date = new Date(Number(entry.timestamp) / 1000000); // Convert nanoseconds to milliseconds
  const formattedDate = format(date, 'MMMM d, yyyy');
  const formattedTime = format(date, 'h:mm a');

  const isUploading = addImages.isPending;
  const isDeleting = removePhoto.isPending;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6 px-0 space-y-4">
        <div className="flex items-start justify-between gap-4 px-6">
          <div className="flex-1 space-y-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{formattedDate}</span>
              <span className="mx-2">·</span>
              <span>{formattedTime}</span>
            </div>

            {isEditing ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            ) : (
              <p className="text-foreground whitespace-pre-wrap leading-relaxed px-6 -mx-6">{entry.text}</p>
            )}

            {entry.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {entry.images.map((image, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.getDirectURL()}
                      alt={`Entry image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoToDelete(image)}
                      disabled={isDeleting}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Add Photo
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={updateEntry.isPending || !editText.trim()}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateEntry.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this gratitude entry? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Photo deletion confirmation dialog */}
      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePhoto}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
