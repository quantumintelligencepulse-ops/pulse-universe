import React from "react";
import { Link, useLocation } from "wouter";
import { 
  MessageSquare, 
  Code2, 
  Plus, 
  Trash2,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useChats, useDeleteChat } from "@/hooks/use-chats";
import logo from "@assets/MyAiGpt_1772000395528.webp";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  const { data: chats = [], isLoading } = useChats();
  const deleteChat = useDeleteChat();

  const isCoder = location === "/coder";
  const isGeneral = location === "/";

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-[#f9f9f9] border-r border-border/50 transform transition-transform duration-300 ease-in-out h-[100dvh]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none">
            <img src={logo} alt="My Ai Gpt" className="w-8 h-8 rounded-full shadow-sm bg-white" />
            <span className="font-semibold text-foreground tracking-tight">My Ai</span>
          </Link>
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-muted-foreground hover:bg-black/5 rounded-lg transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* New Chat Actions */}
        <div className="px-3 pb-4 space-y-2">
          <Link 
            href="/"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group",
              isGeneral ? "bg-white shadow-sm border border-border/50 text-foreground" : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
            )}
          >
            <div className="p-1.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <MessageSquare size={16} className={isGeneral ? "text-primary" : ""} />
            </div>
            My Ai Gpt
            <Plus size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link 
            href="/coder"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group",
              isCoder ? "bg-white shadow-sm border border-border/50 text-foreground" : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
            )}
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Code2 size={16} className={isCoder ? "text-blue-600" : "text-blue-600/70"} />
            </div>
            My Ai Coder
            <Plus size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          <div className="text-xs font-semibold text-muted-foreground mb-3 px-3 tracking-wider uppercase">
            Recent Chats
          </div>
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="animate-pulse space-y-2 px-3">
                <div className="h-8 bg-black/5 rounded-lg"></div>
                <div className="h-8 bg-black/5 rounded-lg"></div>
                <div className="h-8 bg-black/5 rounded-lg"></div>
              </div>
            ) : chats.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No chats yet
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = location === `/chat/${chat.id}`;
                return (
                  <div key={chat.id} className="relative group">
                    <Link
                      href={`/chat/${chat.id}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 pr-10",
                        isActive 
                          ? "bg-white shadow-sm border border-border/50 text-foreground font-medium" 
                          : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
                      )}
                    >
                      {chat.type === 'coder' ? (
                        <Code2 size={14} className="flex-shrink-0 text-blue-600/60" />
                      ) : (
                        <MessageSquare size={14} className="flex-shrink-0 text-foreground/50" />
                      )}
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm('Delete this chat?')) {
                          deleteChat.mutate(chat.id);
                        }
                      }}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100",
                        isActive && "opacity-100"
                      )}
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Toggle Button (visible when sidebar closed) */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 p-2.5 bg-background border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:bg-muted/50 transition-all text-foreground"
          title="Open sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}
    </>
  );
}
