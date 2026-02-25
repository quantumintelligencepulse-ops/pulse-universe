import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User } from "lucide-react";
import logo from "@assets/MyAiGpt_1772000395528.webp";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant" | "system" | string;
  content: string;
  isThinking?: boolean;
}

export function ChatMessage({ role, content, isThinking }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "py-6 px-4 md:px-8 w-full flex justify-center transition-colors duration-300",
        isUser ? "bg-transparent" : "bg-muted/30 border-y border-border/40"
      )}
    >
      <div className="flex w-full max-w-3xl gap-5">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <User size={18} strokeWidth={2.5} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-0.5">
              <img src={logo} alt="AI" className="w-full h-full object-cover rounded-full" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="font-semibold text-sm text-foreground/80">
            {isUser ? "You" : "My Ai"}
          </div>
          
          <div className="text-foreground prose prose-sm max-w-none markdown-body">
            {isThinking ? (
              <div className="flex items-center h-6 gap-1">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full typing-dot" />
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="my-4 rounded-xl overflow-hidden shadow-sm border border-border/50">
                        <div className="bg-zinc-900 px-4 py-2 text-xs font-sans text-zinc-400 flex justify-between items-center border-b border-zinc-800">
                          <span>{match[1]}</span>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1rem', background: '#0f0f0f' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary border border-border/50"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
