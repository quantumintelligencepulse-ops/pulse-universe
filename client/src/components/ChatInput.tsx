import React, { useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Message My Ai..." }: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    handleInput();
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative max-w-3xl w-full mx-auto"
    >
      <div className="relative flex items-end p-2 bg-background border border-border/60 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-primary/30 transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 resize-none py-2.5 pl-3 pr-12 focus:ring-0 focus:outline-none scrollbar-hide text-base leading-relaxed"
          rows={1}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className={cn(
              "p-2 rounded-xl flex items-center justify-center transition-all duration-200",
              value.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:scale-105 hover:shadow-md active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="text-center mt-2 text-xs text-muted-foreground font-medium">
        My Ai can make mistakes. Consider verifying important information.
      </div>
    </form>
  );
}
