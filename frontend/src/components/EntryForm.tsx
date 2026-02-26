import { useState } from 'react';
import { useCreateEntry, useCreateEntryWithImages } from '../hooks/useQueries';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import ImageUpload from './ImageUpload';
import { Mic, MicOff, Loader2, Send, AlertCircle } from 'lucide-react';
import { ExternalBlob } from '../backend';

export default function EntryForm() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<ExternalBlob[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createEntry = useCreateEntry();
  const createEntryWithImages = useCreateEntryWithImages();
  const { identity } = useInternetIdentity();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  // The effective text is what the user sees: typed text + live transcript
  const effectiveText = isListening ? `${text} ${transcript}`.trim() : text.trim();

  const handleMicClick = () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        setText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript).trim());
      }
    } else {
      startListening();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identity) {
      setErrorMsg('Please sign in to save your entry.');
      return;
    }

    // Stop listening if active and merge transcript into text
    let finalText = text;
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        finalText = text ? `${text} ${finalTranscript}` : finalTranscript;
      }
    }

    finalText = finalText.trim();
    if (!finalText) return;

    try {
      if (images.length > 0) {
        // Use createEntryWithImages to create entry and attach images in one call
        await createEntryWithImages.mutateAsync({ text: finalText, images });
      } else {
        // No images — use the simpler createEntry call
        await createEntry.mutateAsync(finalText);
      }

      // Reset form on success
      setText('');
      setImages([]);
    } catch (error: unknown) {
      console.error('Failed to create entry:', error);
      setErrorMsg('Failed to save entry. Please try again.');
    }
  };

  const isSubmitting = createEntry.isPending || createEntryWithImages.isPending;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={isListening ? `${text} ${transcript}`.trim() : text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I'm grateful for..."
            className="min-h-[120px] w-full resize-none"
            disabled={isSubmitting}
          />

          {isListening && (
            <div className="text-sm text-warm-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-warm-500 rounded-full animate-pulse" />
              Listening...
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <ImageUpload images={images} onChange={setImages} disabled={isSubmitting} />

          <div className="flex gap-2">
            {isSupported && (
              <Button
                type="button"
                size="icon"
                variant={isListening ? 'default' : 'outline'}
                className={isListening ? 'bg-warm-500 hover:bg-warm-600 text-white animate-pulse' : ''}
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

            <Button
              type="submit"
              className="flex-1"
              disabled={!effectiveText || isSubmitting}
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
