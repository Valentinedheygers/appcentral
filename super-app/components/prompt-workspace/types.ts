export interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  systemPrompt: string;
  suggestions: string[];
}

export interface OutputBlock {
  id: string;
  type: "text" | "phases" | "metrics" | "actions";
  title: string;
  content: string;
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  type: "meeting" | "task" | "deadline";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface QuickAction {
  label: string;
  icon: string;
  agents: string[];
  prompt: string;
}
