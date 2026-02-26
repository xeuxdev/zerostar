import { Button } from "~/components/ui/button";
import { Send, Flame } from "lucide-react";
import { useRef, useEffect } from "react";

export function ChatInputFooter({
  rageMode,
  isSending,
  isDiagnosing,
  historyLength,
  inputVal,
  setInputVal,
  handleSend,
  onDiagnose,
}: {
  rageMode: boolean;
  isSending: boolean;
  isDiagnosing: boolean;
  historyLength: number;
  inputVal: string;
  setInputVal: (val: string) => void;
  handleSend: () => void;
  onDiagnose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputVal === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputVal]);

  return (
    <footer
      className={`p-4 md:p-6 border-t-[3px] ${
        rageMode
          ? "border-[#ff3333] bg-[#1a0505]"
          : "border-[#333] bg-[#0f0f0f]"
      } shrink-0`}
    >
      <form
        className="w-full max-w-4xl mx-auto flex gap-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <div className="flex-1 relative group w-full">
          <textarea
            ref={textareaRef}
            className={`block w-full min-h-15 max-h-50 resize-none border-[3px] rounded-none p-4 pr-16 focus:outline-none transition-colors no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
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
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                200,
              )}px`;
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
            <Flame className="absolute right-16 top-1/2 -translate-y-1/2 text-[#ff3333] opacity-20 pointer-events-none w-8 h-8 group-focus-within:opacity-100 transition-opacity" />
          )}

          <Button
            type="submit"
            disabled={isSending || !inputVal.trim()}
            className={`absolute right-1 bottom-1 h-12 w-12 shrink-0 rounded-none flex items-center justify-center border-2 transition-all
              ${
                rageMode
                  ? "bg-[#ff3333] text-[#1a0505] border-[#ff3333] hover:bg-[#cc0000]"
                  : "bg-[#d4d4d4] text-[#0f0f0f] border-[#d4d4d4] hover:bg-white"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {/* Mobile Diagnose Button */}
      <div className="w-full max-w-4xl mx-auto mt-4 md:hidden">
        <Button
          onClick={onDiagnose}
          disabled={isDiagnosing || historyLength === 0}
          className={`uppercase w-full font-bold tracking-widest px-6 py-4 rounded-none border-2 transition-all
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
  );
}
