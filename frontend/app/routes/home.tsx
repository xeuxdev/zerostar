import type { Route } from "./+types/home";
import { useState, useRef, useEffect, useCallback } from "react";

import { ChatHeader } from "~/components/chat/header";
import { ChatInputFooter } from "~/components/chat/input-footer";
import { ChatMessage } from "~/components/chat/message";
import { DiagnosticsModal } from "~/components/chat/diagnostics-modal";
import type { Message } from "~/components/chat/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ZeroStar :: Anti-Therapy Substation" },
    {
      name: "description",
      content:
        "An unapologetically honest, satirical conversational AI anti-therapist.",
    },
  ];
}

const STARTER_PROMPTS = [
  "My boss yelled at me for being 2 hours late.",
  "My partner is gaslighting me because I forgot our anniversary.",
  "Everyone at my job is toxic except for me.",
];

export default function Home() {
  const [history, setHistory] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [rageMode, setRageMode] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [currentStream, setCurrentStream] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mainScrollRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);

  // Dismiss intro screen
  const dismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismissIntro, 1800);
    return () => clearTimeout(timer);
  }, [dismissIntro]);

  // Monitor user scroll position to prevent scroll-fight during streaming
  const handleScroll = useCallback(() => {
    if (!mainScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainScrollRef.current;
    // Consider near bottom if within 80px
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  }, []);

  // Smooth layout-friendly auto scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!mainScrollRef.current) return;
    if (behavior === "auto") {
      mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
    } else {
      mainScrollRef.current.scrollTo({
        top: mainScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current || isSending) {
      scrollToBottom(currentStream ? "auto" : "smooth");
    }
  }, [history, currentStream, isSending, scrollToBottom]);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = (overrideMessage ?? inputVal).trim();
    if (!messageToSend || isSending) return;

    setInputVal("");
    setErrorMessage(null);
    setIsSending(true);
    setDiagnosis(null);
    setCurrentStream("");
    isNearBottomRef.current = true;

    // Optimistically add user message
    const newHistory: Message[] = [
      ...history,
      { role: "user", content: messageToSend },
    ];
    setHistory(newHistory);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: messageToSend }),
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
                } catch {
                  // Ignore JSON parse errors for incomplete frames
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
    } catch {
      setErrorMessage(
        "Dr. Blane walked out. Try refreshing or testing your patience.",
      );
    } finally {
      setIsSending(false);
      setCurrentStream("");
    }
  };

  const handleDiagnose = async () => {
    if (history.length === 0 || isDiagnosing) return;

    setIsDiagnosing(true);
    setErrorMessage(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      const data = await res.json();
      if (res.ok && data.diagnosis) {
        setDiagnosis(data.diagnosis);
      } else {
        setErrorMessage(
          data.message || "Diagnosis failed. You broke the machine.",
        );
      }
    } catch {
      setErrorMessage("Failed to run diagnosis. Even our server has limits.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div
      className={`relative h-dvh w-full flex flex-col overflow-hidden font-mono text-base transition-[background-color,color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        rageMode ? "bg-[#120202] text-[#ff3333]" : "bg-[#0f0f0f] text-[#d4d4d4]"
      }`}
    >
      {/* Intro Animation Overlay */}
      <div
        onClick={dismissIntro}
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f0f] transition-[opacity,filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer select-none ${
          showIntro ? "opacity-100" : "opacity-0 pointer-events-none blur-sm"
        }`}
      >
        <img
          src="/logo-3.png"
          alt="ZeroStar Logo"
          className="w-28 h-28 md:w-40 md:h-40 invert mix-blend-lighten opacity-90 animate-pulse"
        />
        <h1 className="mt-6 text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#d4d4d4]">
          ZeroStar
        </h1>
        <p className="mt-3 text-xs md:text-sm tracking-[0.25em] uppercase opacity-50">
          Initializing apathy module...
        </p>
        <span className="mt-6 text-[10px] tracking-widest uppercase opacity-30 border border-current px-2.5 py-1">
          Click anywhere to skip
        </span>
      </div>

      <ChatHeader
        rageMode={rageMode}
        isDiagnosing={isDiagnosing}
        historyLength={history.length}
        onDiagnose={handleDiagnose}
      />

      {/* Error alert banner */}
      {errorMessage && (
        <div className="w-full bg-[#3b0808] border-b-2 border-[#ff3333] px-4 py-2.5 text-xs md:text-sm text-[#ff6666] flex items-center justify-between shrink-0 font-mono">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="uppercase font-bold tracking-wider underline hover:opacity-80 ml-4 cursor-pointer"
            aria-label="Dismiss error banner"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <main
        ref={mainScrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col items-center"
      >
        <div className="w-full max-w-4xl p-4 md:p-8 flex flex-col gap-5 md:gap-8 pb-32">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none py-8">
              <img
                src="/logo-3-1.png"
                alt="Ghost"
                className="w-20 h-20 mb-5 invert mix-blend-lighten opacity-80 animate-pulse"
              />
              <p className="text-xl md:text-2xl font-black tracking-widest uppercase mb-1">
                Speak
              </p>
              <p className="text-xs md:text-sm opacity-50 mb-8">
                We are not listening, but feel free to embarrass yourself.
              </p>

              <div className="flex flex-col gap-2.5 w-full max-w-md">
                <p className="text-[11px] uppercase tracking-widest opacity-40 text-left">
                  Or pick a common excuse:
                </p>
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs md:text-sm p-3 border-2 border-[#333] hover:border-[#d4d4d4] hover:bg-[#141414] transition-[border-color,background-color,transform] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] text-[#bbb] hover:text-[#fff] cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
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
            <div className="flex items-center gap-3 opacity-60 px-2 py-1 select-none">
              <span
                className={`h-2.5 w-2.5 ${rageMode ? "bg-[#ff3333]" : "bg-[#d4d4d4]"} animate-pulse block`}
              />
              <span className="uppercase text-xs tracking-widest">
                Formulating condescending reply...
              </span>
            </div>
          )}
        </div>
      </main>

      <ChatInputFooter
        rageMode={rageMode}
        isSending={isSending}
        inputVal={inputVal}
        setInputVal={setInputVal}
        handleSend={() => handleSend()}
      />

      <DiagnosticsModal
        diagnosis={diagnosis}
        rageMode={rageMode}
        onClose={() => setDiagnosis(null)}
      />
    </div>
  );
}
