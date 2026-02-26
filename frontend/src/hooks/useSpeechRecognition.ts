import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => string;
  isSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const finalTranscriptRef = useRef('');

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Update final transcript accumulator
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      // Set display transcript (final + interim)
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    finalTranscriptRef.current = '';
    setTranscript('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = (): string => {
    if (!recognitionRef.current || !isListening) return '';

    recognitionRef.current.stop();
    setIsListening(false);
    
    // Return the accumulated final transcript
    const result = finalTranscriptRef.current || transcript;
    
    // Don't clear transcript immediately - let the component handle it
    return result.trim();
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  };
}
