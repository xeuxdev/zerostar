import type { Route } from "./+types/home";
import { useState, useRef, useEffect } from "react";

import { ChatHeader } from "~/components/chat/header";
import { ChatInputFooter } from "~/components/chat/input-footer";
import { ChatMessage } from "~/components/chat/message";
import { DiagnosticsModal } from "~/components/chat/diagnostics-modal";
import type { Message } from "~/components/chat/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ZeroStar :: The Void" },
    { name: "description", content: "Speak into the void." },
  ];
}

export default function Home() {
  const [history, setHistory] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [rageMode, setRageMode] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [currentStream, setCurrentStream] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: behavior, block: "end" });
    }
  };

  useEffect(() => {
    // Use snap scrolling during active streaming, but smooth for user actions
    scrollToBottom(currentStream ? "auto" : "smooth");
  }, [history, currentStream, isSending]);

  const handleSend = async () => {
    if (!inputVal.trim() || isSending) return;

    const userMsg = inputVal.trim();
    setInputVal("");
    setIsSending(true);
    setDiagnosis(null);
    setCurrentStream("");

    // Optimistically add user message
    const newHistory: Message[] = [
      ...history,
      { role: "user", content: userMsg },
    ];
    setHistory(newHistory);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: userMsg }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedResponse = "";
      let foundRage = false;

      if (reader) {
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim();
                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === "start") {
                    if (data.rage_mode) {
                      setRageMode(true);
                      foundRage = true;
                    } else {
                      setRageMode(false);
                    }
                  } else if (data.type === "chunk") {
                    streamedResponse += data.content;
                    setCurrentStream(streamedResponse);
                  } else if (data.type === "done") {
                    done = true;
                  }
                } catch (err) {
                  console.error("Failed to parse SSE line", err);
                }
              }
            }
          }
        }
      }

      // Add actual response to history
      setHistory([...newHistory, { role: "model", content: streamedResponse }]);
      setCurrentStream("");

      if (!foundRage) {
        setRageMode(false);
      }
    } catch (e) {
      console.error(e);
      alert("System failure. Figures.");
    } finally {
      setIsSending(false);
      setCurrentStream("");
    }
  };

  const handleDiagnose = async () => {
    if (history.length === 0) return;

    setIsDiagnosing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiagnosis(data.diagnosis);
      } else {
        alert(data.message || "An error occurred in diagnosis");
      }
    } catch (e) {
      alert("Failed to run diagnosis");
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div
      className={`relative h-dvh w-full flex flex-col overflow-hidden font-mono text-base transition-colors duration-1000 ${
        rageMode ? "bg-[#1a0505] text-[#ff3333]" : "bg-[#0f0f0f] text-[#d4d4d4]"
      }`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {/* Intro Animation Overlay */}
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f0f] transition-all duration-1000 pointer-events-none ease-in-out ${
          showIntro ? "opacity-100" : "opacity-0 invisible blur-lg"
        }`}
      >
        <img
          src="/logo-3.png"
          alt="ZeroStar Logo"
          className="w-32 h-32 md:w-48 md:h-48 invert mix-blend-lighten opacity-90 animate-pulse"
        />
        <h1 className="mt-8 text-2xl md:text-5xl font-black uppercase tracking-[0.2em] text-[#d4d4d4]">
          ZeroStar
        </h1>
        <p className="mt-4 text-xs md:text-sm tracking-[0.3em] uppercase opacity-40">
          Initializing apathy module...
        </p>
      </div>

      <ChatHeader
        rageMode={rageMode}
        isDiagnosing={isDiagnosing}
        historyLength={history.length}
        onDiagnose={handleDiagnose}
      />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col items-center">
        <div
          className="w-full max-w-4xl p-4 md:p-8 flex flex-col gap-6 md:gap-10 pb-32"
          ref={scrollRef}
        >
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center select-none transition-opacity duration-1000 delay-500">
              <img
                src="/logo-3-1.png"
                alt="Ghost"
                className="w-24 h-24 mb-6 invert mix-blend-lighten opacity-80 animate-pulse"
              />
              <p className="text-xl md:text-3xl tracking-widest uppercase mb-2">
                Speak
              </p>
              <p className="text-sm">We are not listening.</p>
            </div>
          )}

          {history.map((msg, i) => (
            <ChatMessage key={i} msg={msg} isRage={rageMode} />
          ))}

          {currentStream && (
            <ChatMessage
              msg={{ role: "model", content: currentStream }}
              isRage={rageMode}
              isStreaming
            />
          )}

          {isSending && !currentStream && (
            <div className="flex items-center gap-4 opacity-50">
              <span
                className={`h-3 w-3 ${rageMode ? "bg-[#ff3333]" : "bg-[#d4d4d4]"} animate-pulse block`}
              />
              <span className="uppercase text-sm tracking-widest">
                Processing
              </span>
            </div>
          )}

          <div ref={bottomRef} className="h-4 w-full" />
        </div>
      </main>

      <ChatInputFooter
        rageMode={rageMode}
        isSending={isSending}
        inputVal={inputVal}
        setInputVal={setInputVal}
        handleSend={handleSend}
      />

      <DiagnosticsModal
        diagnosis={diagnosis}
        rageMode={rageMode}
        onClose={() => setDiagnosis(null)}
      />
    </div>
  );
}
