import { useState, useRef } from 'react';
import { JournalEntry, ExternalBlob } from '../backend';
import { useUpdateEntry, useDeleteEntry, useAddImagesToEntry, useRemovePhotoFromEntry } from '../hooks/useQueries';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
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
import { Edit2, Trash2, Save, X, ImagePlus, Loader2, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';
import PhotoViewer from './PhotoViewer';

interface EntryCardProps {
  entry: JournalEntry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [photoToDelete, setPhotoToDelete] = useState<ExternalBlob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const addImages = useAddImagesToEntry();
  const removePhoto = useRemovePhotoFromEntry();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  const handleSave = async () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        setEditText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    }

    if (editText.trim() && editText !== entry.text) {
      await updateEntry.mutateAsync({ id: entry.id, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isListening) {
      stopListening();
    }
    setEditText(entry.text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteEntry.mutateAsync(entry.id);
  };

  const handleMicClick = () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        setEditText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    } else {
      startListening();
    }
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

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  const date = new Date(Number(entry.timestamp) / 1000000);
  const formattedDate = format(date, 'MMMM d, yyyy');
  const formattedTime = format(date, 'h:mm a');

  const isUploading = addImages.isPending;
  const isDeleting = removePhoto.isPending;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6 px-6 space-y-3">
          {/* Date/time row */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{formattedDate}</span>
            <span className="mx-2">·</span>
            <span>{formattedTime}</span>
          </div>

          {/* Entry text — full width */}
          {isEditing ? (
            <div className="relative">
              <Textarea
                value={isListening ? `${editText} ${transcript}`.trim() : editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[100px] pr-12 w-full"
                autoFocus
              />
              {isSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  className={`absolute right-2 top-2 ${
                    isListening ? 'bg-warm-500 hover:bg-warm-600 text-white animate-pulse' : ''
                  }`}
                  onClick={handleMicClick}
                  disabled={updateEntry.isPending}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
              {isListening && (
                <div className="text-sm text-warm-600 flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-warm-500 rounded-full animate-pulse" />
                  Listening...
                </div>
              )}
            </div>
          ) : (
            <p className="text-foreground whitespace-pre-wrap leading-relaxed w-full">{entry.text}</p>
          )}

          {/* Images grid */}
          {entry.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {entry.images.map((image, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.getDirectURL()}
                    alt={`Entry image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handlePhotoClick(index)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoToDelete(image);
                    }}
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

          {/* Action toolbar — below the text */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            {/* Left: Add Photo */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-muted-foreground hover:text-foreground"
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

            {/* Right: Edit / Delete (or Save / Cancel when editing) */}
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={updateEntry.isPending || !editText.trim()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {updateEntry.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={updateEntry.isPending}
                    className="text-muted-foreground hover:text-foreground"
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
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                      >
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

      {/* Photo viewer modal */}
      {viewerOpen && (
        <PhotoViewer
          images={entry.images}
          currentIndex={currentPhotoIndex}
          onClose={() => setViewerOpen(false)}
          onNavigate={setCurrentPhotoIndex}
        />
      )}
    </>
  );
}
