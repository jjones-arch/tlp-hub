"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What should I focus on this week?",
  "What are the biggest risks right now?",
  "Summarize Q2 progress",
  "What decisions still need to be made?",
  "What is blocking us?",
  "How is Zipped progressing?",
  "Give me a status update I can share with Dave",
  "What tasks are overdue or blocked?",
];

function renderMarkdown(raw: string): string {
  let html = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  html = html.replace(/^### (.+)$/gm, '<div style="font-weight:700;font-size:14px;margin:12px 0 4px">$1</div>');
  html = html.replace(/^## (.+)$/gm, '<div style="font-weight:700;font-size:15px;margin:14px 0 4px">$1</div>');
  html = html.replace(/^# (.+)$/gm, '<div style="font-weight:700;font-size:16px;margin:16px 0 6px">$1</div>');

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(
    /`(.+?)`/g,
    '<code style="background:#F5F3EF;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>',
  );

  const lines = html.split("\n");
  let result = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-•] /.test(trimmed)) {
      if (!inList) {
        result += "<ul style='margin:4px 0;padding-left:20px'>";
        inList = true;
      }
      result += `<li style="margin:2px 0;font-size:13px">${trimmed.replace(/^[-•] /, "")}</li>`;
    } else {
      if (inList) {
        result += "</ul>";
        inList = false;
      }
      if (trimmed === "") {
        result += "<br/>";
      } else {
        result += `<p style="margin:2px 0">${trimmed}</p>`;
      }
    }
  }
  if (inList) result += "</ul>";

  return result;
}

export default function AssistantPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data: { role: string; content: string }[]) => {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      })
      .catch(() => toast("Failed to load chat history", "err"))
      .finally(() => setInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function resizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 110) + "px";
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast("Failed to get response", "err");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStarter(text: string) {
    setInput(text);
    sendMessage(text);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-surface border-b border-border px-6 py-4">
        <h1 className="font-serif text-[20px] font-bold text-text leading-tight">AI Assistant</h1>
        <p className="text-[12.5px] text-text-3 mt-0.5">
          Powered by Claude · Ask anything about the Technology Lifecycle Program
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {initialLoad ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-text-3" style={{ animation: "bounce-dots 1s infinite 0ms" }} />
              <span className="w-2 h-2 rounded-full bg-text-3" style={{ animation: "bounce-dots 1s infinite 150ms" }} />
              <span className="w-2 h-2 rounded-full bg-text-3" style={{ animation: "bounce-dots 1s infinite 300ms" }} />
            </div>
          </div>
        ) : !hasMessages ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center max-w-[520px]">
              <h2 className="font-serif text-[22px] font-bold text-text mb-2">What do you need to know?</h2>
              <p className="text-[13px] text-text-3 mb-6 leading-relaxed">
                Ask about initiatives, tasks, risks, decisions, or anything else in the Technology Lifecycle Program.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStarter(s)}
                    className="px-3.5 py-2 rounded-full border border-border bg-surface text-[12.5px] text-text-2 hover:border-navy hover:text-navy transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[700px] mx-auto px-6 py-6 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center">
                    <span className="text-[11px] font-bold text-accent">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-[13.5px] leading-relaxed ${
                    msg.role === "user" ? "bg-navy text-white" : "bg-surface border border-border text-text"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span>{msg.content}</span>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">JJ</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center">
                  <span className="text-[11px] font-bold text-accent">AI</span>
                </div>
                <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-text-3"
                    style={{ animation: "bounce-dots 1s infinite 0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-text-3"
                    style={{ animation: "bounce-dots 1s infinite 150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-text-3"
                    style={{ animation: "bounce-dots 1s infinite 300ms" }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-surface border-t border-border px-6 py-3">
        <div className="max-w-[700px] mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the program…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-bg px-4 py-2.5 text-[13.5px] text-text placeholder:text-text-3 focus:outline-none focus:border-navy transition-colors"
            style={{ maxHeight: 110 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-lg bg-navy text-white flex items-center justify-center hover:bg-navy-h transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
