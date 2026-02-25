import React from "react";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";

export default function Coder() {
  return (
    <Layout>
      <ChatInterface defaultType="coder" />
    </Layout>
  );
}
