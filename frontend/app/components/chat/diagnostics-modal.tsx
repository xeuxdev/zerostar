import { Button } from "~/components/ui/button";
import { Skull, Ghost, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function DiagnosticsModal({
  diagnosis,
  rageMode,
  onClose,
}: {
  diagnosis: string | null;
  rageMode: boolean;
  onClose: () => void;
}) {
  if (!diagnosis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col border-[3px] shadow-2xl overflow-hidden
        ${
          rageMode
            ? "border-[#ff3333] bg-[#0f0303]"
            : "border-[#d4d4d4] bg-[#0f0f0f]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b-[3px] shrink-0
          ${rageMode ? "border-[#ff3333] bg-[#1a0505]" : "border-[#333] bg-[#1a1a1a]"}`}
        >
          <div className="flex items-center gap-3">
            {rageMode ? (
              <Skull className="w-5 h-5 text-[#ff3333] animate-pulse" />
            ) : (
              <Ghost className="w-5 h-5 text-[#d4d4d4]" />
            )}
            <h2
              className={`font-black uppercase tracking-widest text-lg md:text-xl
              ${rageMode ? "text-[#ff3333]" : "text-[#d4d4d4]"}`}
            >
              Clinical Diagnosis
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 transition-colors hover:opacity-70 ${
              rageMode ? "text-[#ff3333]" : "text-[#d4d4d4]"
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar font-sans">
          <div
            className={`leading-relaxed md:text-lg wrap-break-word tracking-wide
            ${rageMode ? "text-[#ff3333]" : "text-[#d4d4d4]"}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p className="mb-4 last:mb-0" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => <li className="" {...props} />,
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-xl font-black mb-4 uppercase tracking-wider"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-lg font-bold mb-3 uppercase tracking-wide"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-base font-bold mb-2 uppercase"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="underline hover:opacity-80 font-bold"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-extrabold" {...props} />
                ),
                code: ({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <div className="my-4 border-2 border-inherit bg-black/5 dark:bg-white/5">
                      {match && (
                        <div className="px-2 py-1 text-xs uppercase font-black border-b-2 border-inherit opacity-70">
                          {match[1]}
                        </div>
                      )}
                      <pre className="p-3 overflow-x-auto font-mono text-sm leading-tight">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 mx-0.5 rounded-sm font-mono text-sm font-bold"
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
          className={`p-4 border-t-[3px] shrink-0 flex justify-end
          ${rageMode ? "border-[#ff3333] bg-[#1a0505]" : "border-[#333] bg-[#1a1a1a]"}`}
        >
          <Button
            onClick={onClose}
            className={`uppercase font-bold tracking-widest px-8 py-4 rounded-none border-2 transition-all
              ${
                rageMode
                  ? "bg-[#1a0505] border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#1a0505]"
                  : "bg-transparent border-[#d4d4d4] text-[#d4d4d4] hover:bg-[#d4d4d4] hover:text-[#0f0f0f]"
              }`}
          >
            Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}
