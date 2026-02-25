import type { Route } from "./+types/home";
import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Send, Activity, User, Flame, Skull, Ghost } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ZeroStar :: The Void" },
    { name: "description", content: "Speak into the void." },
  ];
}

type Role = "user" | "model";

interface Message {
  role: Role;
  content: string;
}

export default function Home() {
  const [history, setHistory] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [rageMode, setRageMode] = useState(false);

  const [currentStream, setCurrentStream] = useState("");

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
      const res = await fetch("/api/v1/chat", {
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
      const res = await fetch("/api/v1/diagnose", {
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
      className={`h-[100dvh] w-full flex flex-col overflow-hidden font-mono text-base transition-colors duration-1000 ${
        rageMode ? "bg-[#1a0505] text-[#ff3333]" : "bg-[#0f0f0f] text-[#d4d4d4]"
      }`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {/* Brutalist Header */}
      <header
        className={`p-4 md:p-6 border-b-[3px] flex items-center justify-between shrink-0 transition-colors duration-700 ${rageMode ? "border-[#ff3333] shadow-[0_4px_30px_rgba(255,51,51,0.2)]" : "border-[#333]"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-sm ${rageMode ? "bg-[#ff3333] text-black" : "bg-[#d4d4d4] text-black"} uppercase font-black tracking-tighter text-2xl`}
          >
            {rageMode ? (
              <Skull className="w-6 h-6 animate-pulse" />
            ) : (
              <Ghost className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest leading-none">
              ZeroStar
            </h1>
            <p className="text-xs md:text-sm mt-1 opacity-60 tracking-wider">
              Antitherapy Substation {rageMode ? "[CRITICAL]" : "[ONLINE]"}
            </p>
          </div>
        </div>

        <Button
          onClick={handleDiagnose}
          disabled={isDiagnosing || history.length === 0}
          className={`uppercase font-bold tracking-widest px-6 py-4 rounded-none border-[2px] transition-all
            ${
              rageMode
                ? "bg-[#1a0505] border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#1a0505]"
                : "bg-transparent border-[#d4d4d4] text-[#d4d4d4] hover:bg-[#0f0f0f] hover:text-[#0f0f0f]"
            } disabled:opacity-30 disabled:cursor-not-allowed hidden md:flex`}
        >
          {isDiagnosing ? "Analyzing..." : "Diagnose"}
          <Activity
            className={`ml-2 w-4 h-4 ${isDiagnosing && "animate-spin"}`}
          />
        </Button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col items-center">
        <div
          className="w-full max-w-4xl p-4 md:p-8 flex flex-col gap-6 md:gap-10 pb-32"
          ref={scrollRef}
        >
          {diagnosis && (
            <div
              className={`p-6 border-[3px] ${rageMode ? "border-[#ff3333] bg-[#2a0808]/50" : "border-[#d4d4d4] bg-[#1f1f1f]/50"} relative group`}
            >
              <div
                className={`absolute -top-3 left-4 px-2 font-black uppercase tracking-widest text-sm ${rageMode ? "bg-[#1a0505] text-[#ff3333]" : "bg-[#0f0f0f] text-[#d4d4d4]"}`}
              >
                Clinical Diagnosis
              </div>
              <p className="leading-relaxed md:text-lg whitespace-pre-wrap mt-2 font-sans tracking-wide">
                {diagnosis}
              </p>
            </div>
          )}

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center opacity-40 select-none">
              <Ghost className="w-24 h-24 mb-6 stroke-[1]" />
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

      {/* Input Form */}
      <footer
        className={`p-4 md:p-6 border-t-[3px] ${rageMode ? "border-[#ff3333] bg-[#1a0505]" : "border-[#333] bg-[#0f0f0f]"} shrink-0`}
      >
        <form
          className="w-full max-w-4xl mx-auto flex gap-4 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex-1 relative group">
            <textarea
              className={`w-full min-h-[60px] max-h-[200px] resize-none border-[3px] rounded-none p-4 pr-12 focus:outline-none transition-colors 
                ${
                  rageMode
                    ? "bg-transparent border-[#ff3333] text-[#ff3333] placeholder:text-[#ff3333]/50 focus:bg-[#330a0a]"
                    : "bg-transparent border-[#555] text-white focus:border-[#d4d4d4]"
                }`}
              placeholder="What's your weak excuse..."
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isSending}
              rows={1}
            />
            {rageMode && (
              <Flame className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ff3333] opacity-20 pointer-events-none w-8 h-8 group-focus-within:opacity-100 transition-opacity" />
            )}
          </div>

          <Button
            type="submit"
            disabled={isSending || !inputVal.trim()}
            className={`h-[60px] w-[60px] shrink-0 rounded-none flex items-center justify-center border-[3px] transition-all
              ${
                rageMode
                  ? "bg-[#ff3333] text-[#1a0505] border-[#ff3333] hover:bg-[#cc0000]"
                  : "bg-[#d4d4d4] text-[#0f0f0f] border-[#d4d4d4] hover:bg-white"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Send className="w-6 h-6" />
          </Button>
        </form>

        {/* Mobile Diagnose Button */}
        <div className="w-full max-w-4xl mx-auto mt-4 md:hidden">
          <Button
            onClick={handleDiagnose}
            disabled={isDiagnosing || history.length === 0}
            className={`uppercase w-full font-bold tracking-widest px-6 py-4 rounded-none border-[2px] transition-all
              ${
                rageMode
                  ? "bg-[#1a0505] border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#1a0505]"
                  : "bg-transparent border-[#d4d4d4] text-[#d4d4d4] hover:bg-[#0f0f0f] hover:text-[#d4d4d4]"
              } disabled:opacity-30`}
          >
            {isDiagnosing ? "Analyzing..." : "Diagnose"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function ChatMessage({
  msg,
  isRage,
  isStreaming,
}: {
  msg: Message;
  isRage: boolean;
  isStreaming?: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <div
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"} group mb-4`}
    >
      <div
        className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar Area */}
        <div className="shrink-0 pt-2 hidden sm:block">
          {isUser ? (
            <div
              className={`w-10 h-10 border-[2px] flex items-center justify-center
              ${isRage ? "border-[#ff3333] text-[#ff3333]/70" : "border-[#d4d4d4] text-[#d4d4d4]/70"}`}
            >
              <User className="w-5 h-5" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 border-[2px] flex items-center justify-center
              ${isRage ? "bg-[#ff3333] text-black border-[#ff3333]" : "bg-[#d4d4d4] text-black border-[#d4d4d4]"}`}
            >
              {isRage ? (
                <Flame className="w-5 h-5 animate-pulse" />
              ) : (
                <Ghost className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Message Bubble Brutalist */}
        <div
          className={`relative px-4 py-3 md:px-6 md:py-4 border-[2px] 
          ${
            isUser
              ? isRage
                ? "border-[#ff3333]/50 bg-transparent text-[#ff3333]"
                : "border-[#555] bg-transparent text-[#d4d4d4]"
              : isRage
                ? "border-[#ff3333] bg-[#2a0808]/30 shadow-[4px_4px_0px_#ff3333]"
                : "border-[#d4d4d4] bg-[#d4d4d4] text-black shadow-[4px_4px_0px_#555]"
          } 
        `}
        >
          <div className="absolute -top-3 left-4 bg-inherit px-2 uppercase tracking-wides text-xs opacity-50 font-bold hidden md:block">
            {isUser ? "YOU" : "HOST"}
          </div>
          <div
            className={`whitespace-pre-wrap leading-relaxed ${!isUser && "font-sans text-[0.95em]"}`}
          >
            {msg.content}
            {isStreaming && (
              <span
                className={`inline-block w-2 items-center justify-center border-b-2 ml-1 animate-pulse ${isRage ? "border-[#ff3333]" : "border-black"}`}
              >
                _
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
