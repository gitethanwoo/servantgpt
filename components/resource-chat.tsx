'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { generateUUID } from '@/lib/utils';

interface ResourceChatProps {
  resourceId: string;
  transcript: string;
  title: string;
  chatId: string;
}

export function ResourceChat({ resourceId, transcript, title, chatId }: ResourceChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
  } = useChat({
    id: chatId,
    body: {
      resourceId,
      transcript,
      title,
    },
    api: '/api/resource-chat',
    sendExtraMessageFields: true,
    experimental_throttle: 100,
    generateId: generateUUID,
    onResponse: (response) => {
      console.log("Chat response received:", response);
      setDebugInfo(`Status: ${response.status}`);
    },
    onFinish: (message) => {
      console.log("Chat finished with message:", message);
      setDebugInfo(prev => `${prev}, Finished`);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setDebugInfo(`Error: ${error.message || 'Unknown error'}`);
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
    
    console.log("Current messages:", messages);
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      console.log("Submitting message:", input);
      handleSubmit(e);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    append({
      role: 'user',
      content: question,
      id: generateUUID(),
    });
  };

  // For testing - retry if something goes wrong
  const handleRetry = () => {
    if (messages.length > 0) {
      reload();
      setDebugInfo('Retrying...');
    }
  };

  // Suggested questions for the resource - limited to 5 most useful ones
  const suggestedQuestions = [
    `Summarize this ${title.includes('video') ? 'video' : 'resource'}`,
    `What are the key takeaways?`,
    `What topics were covered?`,
    `Explain the most technical concept mentioned`,
    `What practical applications were discussed?`,
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-col h-[calc(100vh-300px)] xl:h-[700px]">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Ask questions about this resource</p>
                  <p className="text-sm">
                    The AI assistant has access to the full transcript and can help you understand the content.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4 whitespace-normal"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div>{message.content}</div>
                    ) : (
                      <Markdown>{message.content}</Markdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                    <div className="h-5 w-12 animate-pulse bg-muted-foreground/20 rounded" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-destructive/10 text-destructive text-sm">
                    Error: {error.message || "Something went wrong. Please try again."}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry} 
                      className="ml-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              {debugInfo && process.env.NODE_ENV === 'development' && (
                <div className="flex justify-center">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-muted-foreground text-xs">
                    Debug: {debugInfo}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              placeholder="Ask a question about this resource..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 