import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Code2, Sparkles, Plus } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat, useMessages, useCreateChat, useSendMessage } from "@/hooks/use-chats";
import logo from "@assets/MyAiGpt_1772000395528.webp";

interface ChatInterfaceProps {
  chatId?: number;
  defaultType?: "general" | "coder";
}

export function ChatInterface({ chatId, defaultType = "general" }: ChatInterfaceProps) {
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: chat, isLoading: isChatLoading } = useChat(chatId || null);
  const { data: messages = [], isLoading: isMessagesLoading } = useMessages(chatId || null);
  
  const createChat = useCreateChat();
  const sendMessage = useSendMessage();

  // Local state for optimistic UI during initial chat creation + message send
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);

  const displayType = chat?.type || defaultType;
  const isCoder = displayType === "coder";
  const isEmpty = messages.length === 0 && localMessages.length === 0;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, localMessages, isThinking]);

  const handleSend = async (content: string) => {
    let targetChatId = chatId;
    
    // Optimistic UI update
    setLocalMessages((prev) => [...prev, { role: "user", content }]);
    setIsThinking(true);

    try {
      if (!targetChatId) {
        // 1. Create chat
        const newChat = await createChat.mutateAsync({
          title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
          type: defaultType,
        });
        targetChatId = newChat.id;
      }

      // 2. Send message
      await sendMessage.mutateAsync({
        chatId: targetChatId,
        content,
      });

      // 3. Navigate if this was a new chat
      if (!chatId) {
        setLocation(`/chat/${targetChatId}`);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // In a real app, we'd show a toast here
    } finally {
      setIsThinking(false);
      if (chatId) {
        // Only clear local optimistic if we're already on the chat page, 
        // as React Query will have re-fetched. If navigating, the component unmounts anyway.
        setLocalMessages([]);
      }
    }
  };

  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto w-full scroll-smooth pt-14 pb-32"
      >
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-border/50 flex items-center justify-center mb-6 overflow-hidden p-1">
              <img src={logo} alt="My Ai" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
              {isCoder ? "My Ai Coder" : "How can I help you today?"}
            </h1>
            <p className="text-muted-foreground max-w-md">
              {isCoder 
                ? "I'm specialized in writing, debugging, and explaining code."
                : "Ask me anything, from writing emails to brainstorming ideas."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-2xl w-full">
              {isCoder ? [
                "Write a React component for...",
                "Explain this Python script...",
                "How do I fix this TypeScript error?",
                "Optimize this SQL query..."
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="p-4 text-sm text-left border border-border/50 rounded-xl bg-card hover:bg-muted/50 hover:shadow-sm transition-all duration-200 text-foreground/80 hover:text-foreground"
                >
                  <Code2 size={16} className="mb-2 text-blue-500" />
                  {suggestion}
                </button>
              )) : [
                "Plan a 3-day trip to Tokyo",
                "Write a polite decline email",
                "Explain quantum physics simply",
                "Brainstorm startup ideas"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="p-4 text-sm text-left border border-border/50 rounded-xl bg-card hover:bg-muted/50 hover:shadow-sm transition-all duration-200 text-foreground/80 hover:text-foreground"
                >
                  <Sparkles size={16} className="mb-2 text-amber-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {allMessages.map((msg, index) => (
              <ChatMessage 
                key={index} 
                role={msg.role} 
                content={msg.content} 
              />
            ))}
            {isThinking && (
              <ChatMessage 
                role="assistant" 
                content="" 
                isThinking={true} 
              />
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-6 px-4 md:px-8">
        <ChatInput 
          onSend={handleSend} 
          disabled={isThinking || createChat.isPending || sendMessage.isPending}
          placeholder={isCoder ? "Ask My Ai Coder to write some code..." : "Message My Ai Gpt..."}
        />
      </div>
    </div>
  );
}
