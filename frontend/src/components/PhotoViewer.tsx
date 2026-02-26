import { useEffect } from 'react';
import { ExternalBlob } from '../backend';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoViewerProps {
  images: ExternalBlob[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoViewer({ images, currentIndex, onClose, onNavigate }: PhotoViewerProps) {
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasMultipleImages, onClose]);

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Close button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        aria-label="Close photo viewer"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation arrows */}
      {hasMultipleImages && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            className="absolute left-4 text-white hover:bg-white/20 z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            className="absolute right-4 text-white hover:bg-white/20 z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Photo display */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={images[currentIndex].getDirectURL()}
          alt={`Photo ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Image counter */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
