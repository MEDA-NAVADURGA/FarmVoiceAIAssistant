import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { QuickActions } from './chat/QuickActions';
import { LocationBanner } from './chat/LocationBanner';
import { WelcomeState } from './chat/WelcomeState';
import { VoiceInputButton } from './chat/VoiceInputButton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmer-chat`;

export function FarmerChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { location, loading: locationLoading, error: locationError, permissionDenied, requestLocation } = useGeolocation();
  const { isSpeaking, currentMessageId, speak, stop } = useTextToSpeech();

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = useCallback(async (userMessage: string, allMessages: Message[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          region: location.region,
          district: location.district,
          state: location.state,
          country: location.country,
        } : null,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (response.status === 402) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      throw new Error('Failed to get response');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Handle any remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch { /* ignore */ }
      }
    }
  }, [location]);

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      await streamChat(input, newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleVoiceTranscript = (text: string) => {
    if (text.trim()) {
      handleSend(text);
    }
  };

  const handleSpeak = (messageId: number) => {
    const message = messages[messageId];
    if (message && message.role === 'assistant') {
      speak(message.content, messageId);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <LocationBanner
            location={location}
            loading={locationLoading}
            error={locationError}
            permissionDenied={permissionDenied}
            onRequestLocation={requestLocation}
          />
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col h-full">
              <WelcomeState />
              <div className="mt-6">
                <p className="text-sm text-muted-foreground text-center mb-3">Quick questions:</p>
                <QuickActions onSelect={handleQuickAction} disabled={isLoading} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  messageId={idx}
                  isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'}
                  isSpeaking={isSpeaking}
                  isCurrentlySpeaking={currentMessageId === idx}
                  onSpeak={handleSpeak}
                  onStop={stop}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />
            <div className="flex-1">
              <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                placeholder="Ask about crops, weather, soil, pests..."
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            🎤 Tap the mic to speak • 🔊 Tap "Listen" to hear responses
          </p>
        </div>
      </footer>
    </div>
  );
}
