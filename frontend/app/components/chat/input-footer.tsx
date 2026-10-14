import { Flame, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";

export function ChatInputFooter({
  rageMode,
  isSending,
  inputVal,
  setInputVal,
  handleSend,
}: {
  rageMode: boolean;
  isSending: boolean;
  inputVal: string;
  setInputVal: (val: string) => void;
  handleSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (inputVal) {
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200,
        )}px`;
      }
    }
  }, [inputVal]);

  return (
    <footer
      className={`p-4 md:p-6 border-t-[3px] transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        rageMode
          ? "border-[#ff3333] bg-[#140303]"
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
            className={`block w-full min-h-[60px] max-h-[200px] resize-none border-[3px] rounded-none p-4 pr-16 focus:outline-none transition-[border-color,background-color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden placeholder:text-sm md:placeholder:text-base font-mono
              ${
                rageMode
                  ? "bg-transparent border-[#ff3333] text-[#ff3333] placeholder:text-[#ff3333]/40 focus:bg-[#200505] focus:border-[#ff4d4d]"
                  : "bg-transparent border-[#444] text-[#d4d4d4] placeholder:text-[#d4d4d4]/40 focus:border-[#d4d4d4] focus:bg-[#141414]"
              }`}
            placeholder="Vent your excuses here... (Enter to send, Shift+Enter for newline)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
            rows={1}
            aria-label="Your message to the anti-therapist"
          />
          {rageMode && (
            <Flame className="absolute right-16 top-1/2 -translate-y-1/2 text-[#ff3333] opacity-30 pointer-events-none w-7 h-7 group-focus-within:opacity-100 transition-opacity duration-200" />
          )}

          <Button
            type="submit"
            disabled={isSending || !inputVal.trim()}
            aria-label="Send message"
            className={`absolute right-2 bottom-2 h-11 w-11 shrink-0 rounded-none flex items-center justify-center border-2 transition-[transform,background-color,border-color,color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] cursor-pointer z-10
              ${
                rageMode
                  ? "bg-[#ff3333] text-[#1a0505] border-[#ff3333] hover:bg-[#ff5555] hover:border-[#ff5555]"
                  : "bg-[#d4d4d4] text-[#0f0f0f] border-[#d4d4d4] hover:bg-white hover:border-white"
              } disabled:opacity-25 disabled:cursor-not-allowed`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </footer>
  );
}
