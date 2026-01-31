import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string, messageId: number) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same message that's playing, just stop
    if (currentMessageId === messageId && isSpeaking) {
      setIsSpeaking(false);
      setCurrentMessageId(null);
      return;
    }

    setIsSpeaking(true);
    setCurrentMessageId(messageId);

    try {
      // Strip markdown formatting for cleaner speech
      const cleanText = text
        .replace(/#{1,6}\s/g, '') // Headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/`([^`]+)`/g, '$1') // Code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/[-*]\s/g, '') // List items
        .replace(/\n{2,}/g, '. ') // Multiple newlines to pause
        .replace(/\n/g, ' ') // Single newlines to space
        .trim();

      if (!cleanText) {
        throw new Error('No text to speak');
      }

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: 'Playback Error',
          description: 'Could not play audio.',
          variant: 'destructive',
        });
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setCurrentMessageId(null);
      toast({
        title: 'Voice Error',
        description: 'Could not generate speech. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentMessageId, isSpeaking, toast]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setCurrentMessageId(null);
  }, []);

  return {
    isSpeaking,
    currentMessageId,
    speak,
    stop,
  };
}
