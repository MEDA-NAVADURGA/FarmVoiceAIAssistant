import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<number | null>(null);
  const [isUsingSpeechSynthesis, setIsUsingSpeechSynthesis] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
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
      setIsSpeaking(false);
      setCurrentMessageId(null);
      toast({
        title: 'Voice Error',
        description: 'No text to speak.',
        variant: 'destructive',
      });
      return;
    }

    try {

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
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        toast({
          title: 'Playback Error',
          description: 'Could not play audio.',
          variant: 'destructive',
        });
      };

      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Fallback to browser SpeechSynthesis if available
      if ('speechSynthesis' in window && window.speechSynthesis) {
        try {
          setIsUsingSpeechSynthesis(true);
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentMessageId(null);
            setIsUsingSpeechSynthesis(false);
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            setCurrentMessageId(null);
            setIsUsingSpeechSynthesis(false);
          };
          window.speechSynthesis.speak(utterance);
        } catch (fallbackError) {
          console.error('SpeechSynthesis fallback error:', fallbackError);
          setIsSpeaking(false);
          setCurrentMessageId(null);
          setIsUsingSpeechSynthesis(false);
          toast({
            title: 'Voice Error',
            description: 'Could not generate speech. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        toast({
          title: 'Voice Error',
          description: 'Could not generate speech. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [currentMessageId, isSpeaking, toast]);

  const stop = useCallback(() => {
    console.log('Stop called, isSpeaking:', isSpeaking, 'currentMessageId:', currentMessageId);
    if (audioRef.current) {
      console.log('Pausing audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Clear the src to stop playback
      audioRef.current.load(); // Reset the audio element to stop playback completely
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (isUsingSpeechSynthesis && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentMessageId(null);
    setIsUsingSpeechSynthesis(false);
  }, [isSpeaking, currentMessageId, isUsingSpeechSynthesis]);

  return {
    isSpeaking,
    currentMessageId,
    speak,
    stop,
  };
};
