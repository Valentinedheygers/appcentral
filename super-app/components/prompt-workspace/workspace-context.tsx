"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type { OutputBlock, TimelineItem, ChatMessage } from "./types";

interface WorkspaceState {
  prompt: string;
  activeAgents: string[];
  outputBlocks: OutputBlock[];
  streamingText: string;
  isStreaming: boolean;
  chatPanelOpen: boolean;
  chatMessages: ChatMessage[];
  timelineItems: TimelineItem[];
  activeTab: string;
}

type Action =
  | { type: "SET_PROMPT"; payload: string }
  | { type: "TOGGLE_AGENT"; payload: string }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "APPEND_STREAM"; payload: string }
  | { type: "FINISH_STREAM"; payload: OutputBlock[] }
  | { type: "CLEAR_OUTPUT" }
  | { type: "TOGGLE_CHAT" }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_TAB"; payload: string }
  | { type: "ADD_CONTEXT"; payload: string };

const INITIAL_TIMELINE: TimelineItem[] = [
  { id: "1", time: "09:00", title: "Pipeline Review", type: "meeting" },
  { id: "2", time: "10:30", title: "Acme Corp Follow-up", type: "task" },
  { id: "3", time: "11:00", title: "Q2 Campaign Launch", type: "deadline" },
  { id: "4", time: "13:00", title: "Product Demo — TechStart", type: "meeting" },
  { id: "5", time: "14:30", title: "RFP Response Due", type: "deadline" },
  { id: "6", time: "15:00", title: "Marketing Sync", type: "meeting" },
  { id: "7", time: "16:00", title: "Objection Prep — Enterprise", type: "task" },
  { id: "8", time: "17:00", title: "Weekly Forecast", type: "meeting" },
];

const initialState: WorkspaceState = {
  prompt: "",
  activeAgents: [],
  outputBlocks: [],
  streamingText: "",
  isStreaming: false,
  chatPanelOpen: false,
  chatMessages: [],
  timelineItems: INITIAL_TIMELINE,
  activeTab: "Dashboard",
};

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.payload };
    case "TOGGLE_AGENT": {
      const id = action.payload;
      const active = state.activeAgents.includes(id)
        ? state.activeAgents.filter((a) => a !== id)
        : [...state.activeAgents, id];
      return { ...state, activeAgents: active };
    }
    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };
    case "APPEND_STREAM":
      return { ...state, streamingText: state.streamingText + action.payload };
    case "FINISH_STREAM":
      return {
        ...state,
        isStreaming: false,
        streamingText: "",
        outputBlocks: [...action.payload, ...state.outputBlocks],
      };
    case "CLEAR_OUTPUT":
      return { ...state, outputBlocks: [], streamingText: "" };
    case "TOGGLE_CHAT":
      return { ...state, chatPanelOpen: !state.chatPanelOpen };
    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "ADD_CONTEXT": {
      const separator = state.prompt ? "\n\n" : "";
      return {
        ...state,
        prompt: state.prompt + separator + `[Context: ${action.payload}]`,
      };
    }
    default:
      return state;
  }
}

function parseOutputBlocks(text: string): OutputBlock[] {
  const sections = text.split(/\n---\n/);
  return sections.map((section, i) => {
    const headerMatch = section.match(/^##?\s+(.+)/m);
    const hasMetrics = /\d+%|\$[\d,.]+|[\d,.]+ \w+/.test(section);
    const hasActions = /^\d+\.\s+(Create|Send|Schedule|Draft|Build|Write|Design|Prepare|Develop)/m.test(section);
    const hasPhases = /phase|step|stage/i.test(headerMatch?.[1] || "");

    let type: OutputBlock["type"] = "text";
    if (hasPhases) type = "phases";
    else if (hasActions) type = "actions";
    else if (hasMetrics) type = "metrics";

    return {
      id: `block-${Date.now()}-${i}`,
      type,
      title: headerMatch?.[1] || `Section ${i + 1}`,
      content: section.trim(),
    };
  });
}

interface WorkspaceContextValue extends WorkspaceState {
  dispatch: React.Dispatch<Action>;
  submitPrompt: () => Promise<void>;
  cancelStream: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "SET_STREAMING", payload: false });
  }, []);

  const submitPrompt = useCallback(async () => {
    const { prompt, activeAgents } = stateRef.current;
    if (!prompt.trim()) return;

    const apiKey = localStorage.getItem("anthropic_api_key") || "";

    dispatch({ type: "SET_STREAMING", payload: true });
    dispatch({ type: "APPEND_STREAM", payload: "" }); // reset

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/prompt-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          agents: activeAgents,
          apiKey,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        dispatch({
          type: "FINISH_STREAM",
          payload: [
            {
              id: `err-${Date.now()}`,
              type: "text",
              title: "Error",
              content: errText || `Server error (${res.status})`,
            },
          ],
        });
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            accumulated += data;
            dispatch({ type: "APPEND_STREAM", payload: data });
          }
        }
      }

      const blocks = parseOutputBlocks(accumulated);
      dispatch({ type: "FINISH_STREAM", payload: blocks });
      dispatch({ type: "SET_PROMPT", payload: "" });
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        dispatch({
          type: "FINISH_STREAM",
          payload: [
            {
              id: `err-${Date.now()}`,
              type: "text",
              title: "Error",
              content: e.message,
            },
          ],
        });
      }
    }
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ ...state, dispatch, submitPrompt, cancelStream }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
