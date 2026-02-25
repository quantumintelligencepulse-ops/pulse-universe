import React from "react";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  return (
    <Layout>
      <ChatInterface defaultType="general" />
    </Layout>
  );
}
