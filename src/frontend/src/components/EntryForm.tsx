import { useState } from 'react';
import { useCreateEntry, useAddImagesToEntry } from '../hooks/useQueries';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import ImageUpload from './ImageUpload';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';
import { ExternalBlob } from '../backend';

export default function EntryForm() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<ExternalBlob[]>([]);
  const createEntry = useCreateEntry();
  const addImages = useAddImagesToEntry();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  // Append transcript to text when it updates
  const handleTranscriptUpdate = (newTranscript: string) => {
    if (newTranscript) {
      setText((prev) => (prev ? `${prev} ${newTranscript}` : newTranscript));
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      const finalTranscript = stopListening();
      handleTranscriptUpdate(finalTranscript);
    } else {
      startListening();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      // Stop listening if active
      if (isListening) {
        const finalTranscript = stopListening();
        handleTranscriptUpdate(finalTranscript);
      }

      // Create entry
      const entryId = await createEntry.mutateAsync(text.trim());

      // Add images if any
      if (images.length > 0) {
        await addImages.mutateAsync({ id: entryId, images });
      }

      // Reset form
      setText('');
      setImages([]);
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  const isSubmitting = createEntry.isPending || addImages.isPending;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={isListening ? `${text} ${transcript}`.trim() : text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I'm grateful for..."
              className="min-h-[120px] pr-12 resize-none"
              disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {isListening && (
            <div className="text-sm text-warm-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-warm-500 rounded-full animate-pulse" />
              Listening...
            </div>
          )}

          <ImageUpload images={images} onChange={setImages} disabled={isSubmitting} />

          <Button
            type="submit"
            className="w-full"
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
