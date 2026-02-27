import { Activity, Skull } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ChatHeader({
  rageMode,
  isDiagnosing,
  historyLength,
  onDiagnose,
}: {
  rageMode: boolean;
  isDiagnosing: boolean;
  historyLength: number;
  onDiagnose: () => void;
}) {
  return (
    <header
      className={`p-4 md:p-6 border-b-[3px] flex items-center justify-between shrink-0 transition-colors duration-700 flex-wrap gap-3 ${
        rageMode
          ? "border-[#ff3333] shadow-[0_4px_30px_rgba(255,51,51,0.2)]"
          : "border-[#333]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-sm ${
            rageMode ? "bg-[#ff3333] text-black" : "bg-[#d4d4d4] text-black"
          } uppercase font-black tracking-tighter text-2xl shrink-0`}
        >
          {rageMode ? (
            <Skull className="size-6 animate-pulse" />
          ) : (
            <img
              src="/logo-3.png"
              alt="ZeroStar"
              className="size-6 mix-blend-multiply opacity-80 shrink-0"
            />
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
        onClick={onDiagnose}
        disabled={isDiagnosing || historyLength === 0}
        className={`uppercase font-bold tracking-widest px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm rounded-none border-2 transition-all flex items-center
          ${
            rageMode
              ? "bg-[#1a0505] border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#1a0505]"
              : "bg-transparent border-[#d4d4d4] text-[#d4d4d4] hover:bg-[#0f0f0f] hover:text-[#0f0f0f]"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {isDiagnosing ? "Analyzing..." : "Diagnose"}
        <Activity
          className={`ml-2 size-3 md:size-4 ${isDiagnosing && "animate-spin"}`}
        />
      </Button>
    </header>
  );
}
