import { useState, useEffect, type ComponentPropsWithoutRef } from "react";
import { Skull, Ghost, X, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";

interface CodeBlockProps extends ComponentPropsWithoutRef<"code"> {
  inline?: boolean;
}

export function DiagnosticsModal({
  diagnosis,
  rageMode,
  onClose,
}: {
  diagnosis: string | null;
  rageMode: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!diagnosis) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diagnosis, onClose]);

  if (!diagnosis) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnosis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnosis-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-sm transition-opacity duration-180 ease-out"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col border-[3px] shadow-2xl overflow-hidden font-mono origin-center transform transition-[transform,opacity,border-color,background-color] duration-180 ease-out animate-in fade-in-0 zoom-in-95
        ${
          rageMode
            ? "border-[#ff3333] bg-[#120202] shadow-[0_0_50px_rgba(255,51,51,0.3)]"
            : "border-[#d4d4d4] bg-[#0f0f0f] shadow-[0_0_50px_rgba(212,212,212,0.15)]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 md:p-5 border-b-[3px] shrink-0
          ${rageMode ? "border-[#ff3333] bg-[#1a0505]" : "border-[#333] bg-[#141414]"}`}
        >
          <div className="flex items-center gap-3">
            {rageMode ? (
              <Skull className="w-5 h-5 text-[#ff3333] animate-pulse" />
            ) : (
              <Ghost className="w-5 h-5 text-[#d4d4d4]" />
            )}
            <h2
              id="diagnosis-modal-title"
              className={`font-black uppercase tracking-widest text-base md:text-lg
              ${rageMode ? "text-[#ff3333]" : "text-[#d4d4d4]"}`}
            >
              Satirical Clinical Diagnosis
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close diagnosis modal"
            className={`p-1.5 border border-transparent transition-[transform,opacity,border-color] duration-160 ease-out active:scale-[0.97] hover:border-current cursor-pointer ${
              rageMode ? "text-[#ff3333]" : "text-[#d4d4d4]"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar font-mono">
          <div
            className={`leading-relaxed text-sm md:text-base wrap-break-word tracking-wide
            ${rageMode ? "text-[#ff6666]" : "text-[#d4d4d4]"}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => (
                  <p className="mb-4 last:mb-0" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-5 mb-4 space-y-1.5" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol
                    className="list-decimal pl-5 mb-4 space-y-1.5"
                    {...props}
                  />
                ),
                li: ({ ...props }) => <li {...props} />,
                h1: ({ ...props }) => (
                  <h1
                    className="text-lg md:text-xl font-black mb-3 uppercase tracking-wider"
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    className="text-base md:text-lg font-bold mb-2.5 uppercase tracking-wide"
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    className="text-sm md:text-base font-bold mb-2 uppercase"
                    {...props}
                  />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-extrabold text-white" {...props} />
                ),
                code: ({
                  inline,
                  className,
                  children,
                  ...props
                }: CodeBlockProps) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <div className="my-3 border-2 border-inherit bg-black/40">
                      {match && (
                        <div className="px-2 py-1 text-xs uppercase font-black border-b-2 border-inherit opacity-70">
                          {match[1]}
                        </div>
                      )}
                      <pre className="p-3 overflow-x-auto text-xs md:text-sm leading-tight">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-black/30 px-1.5 py-0.5 mx-0.5 rounded-none font-mono text-xs md:text-sm font-bold border border-current"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {diagnosis}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t-[3px] shrink-0 flex items-center justify-between gap-3
          ${rageMode ? "border-[#ff3333] bg-[#1a0505]" : "border-[#333] bg-[#141414]"}`}
        >
          <Button
            onClick={handleCopy}
            variant="outline"
            aria-label="Copy diagnosis to clipboard"
            className={`uppercase font-bold tracking-widest px-4 py-2 text-xs md:text-sm rounded-none border-2 transition-[transform,background-color,border-color,color] duration-160 ease-out active:scale-[0.97] cursor-pointer flex items-center gap-2
              ${
                rageMode
                  ? "bg-transparent border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#120202]"
                  : "bg-transparent border-[#888] text-[#d4d4d4] hover:bg-[#222] hover:border-[#d4d4d4]"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Flaws</span>
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            className={`uppercase font-bold tracking-widest px-6 py-2 text-xs md:text-sm rounded-none border-2 transition-[transform,background-color,border-color,color] duration-160 ease-out active:scale-[0.97] cursor-pointer
              ${
                rageMode
                  ? "bg-[#ff3333] border-[#ff3333] text-[#120202] hover:bg-[#ff4d4d]"
                  : "bg-[#d4d4d4] border-[#d4d4d4] text-[#0f0f0f] hover:bg-white hover:border-white"
              }`}
          >
            Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}
