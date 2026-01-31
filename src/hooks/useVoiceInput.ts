import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
}

const SCRIBE_TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`;

export function useVoiceInput({ onTranscript }: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        stream.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Use Web Speech API for simpler transcription (more reliable)
          const transcript = await transcribeWithWebSpeech();
          
          if (transcript) {
            onTranscript(transcript);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: 'Voice Error',
            description: 'Could not transcribe audio. Please try again or type your message.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to use voice input.',
        variant: 'destructive',
      });
    }
  }, [onTranscript, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    toggleRecording,
    startRecording,
    stopRecording,
  };
}

// Use Web Speech API for transcription (works in most browsers)
function transcribeWithWebSpeech(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onend = () => {
      resolve(finalTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      reject(new Error(event.error));
    };

    recognition.start();

    // Auto-stop after 30 seconds
    setTimeout(() => {
      recognition.stop();
    }, 30000);
  });
}
