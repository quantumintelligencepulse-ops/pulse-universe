import React from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatView() {
  const [, params] = useRoute("/chat/:id");
  const chatId = params?.id ? parseInt(params.id, 10) : undefined;

  return (
    <Layout>
      {/* Add a key so switching between chats unmounts and remounts the component to reset internal state if needed */}
      <ChatInterface key={chatId} chatId={chatId} />
    </Layout>
  );
}
