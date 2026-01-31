import { cn } from '@/lib/utils';
import { User, Sprout, Volume2, VolumeX, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  messageId: number;
  isSpeaking?: boolean;
  isCurrentlySpeaking?: boolean;
  onSpeak?: (messageId: number) => void;
  onStop?: () => void;
}

export function ChatMessage({
  role,
  content,
  isStreaming,
  messageId,
  isSpeaking,
  isCurrentlySpeaking,
  onSpeak,
  onStop,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const showSpeakButton = !isUser && content && !isStreaming;

  return (
    <div
      className={cn(
        'flex gap-3 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'gradient-farm text-white'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Sprout className="w-5 h-5" />
        )}
      </div>

      {/* Message Bubble */}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-chat-user text-chat-user-foreground rounded-tr-sm'
              : 'bg-chat-assistant text-chat-assistant-foreground rounded-tl-sm border border-border'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-chat-assistant-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-foreground">{children}</h3>,
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse-slow ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Speak button for assistant messages */}
        {showSpeakButton && (onSpeak !== undefined || onStop !== undefined) && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              try {
                console.log('Button clicked, isCurrentlySpeaking:', isCurrentlySpeaking, 'isSpeaking:', isSpeaking, 'messageId:', messageId, 'onStop exists:', !!onStop);
                if (isCurrentlySpeaking && onStop) {
                  console.log('Calling onStop');
                  onStop();
                } else {
                  console.log('Calling onSpeak');
                  onSpeak?.(messageId);
                }
              } catch (error) {
                console.error('Error in button click:', error);
              }
            }}
            disabled={isSpeaking && !isCurrentlySpeaking}
          >
            {isCurrentlySpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">Stop</span>
              </>
            ) : isSpeaking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">Listen</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
