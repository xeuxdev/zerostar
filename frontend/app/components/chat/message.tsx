import { type ComponentPropsWithoutRef } from "react";
import { Flame, Ghost, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "./types";

interface CodeBlockProps extends ComponentPropsWithoutRef<"code"> {
  inline?: boolean;
}

export function ChatMessage({
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
      className={`w-full flex ${
        isUser ? "justify-end" : "justify-start"
      } group mb-5 transition-opacity duration-160 ease-[cubic-bezier(0.23,1,0.32,1)]`}
    >
      <div
        className={`flex gap-3 md:gap-4 max-w-[94%] md:max-w-[82%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar Area */}
        <div className="shrink-0 pt-1 hidden sm:block select-none">
          {isUser ? (
            <div
              className={`w-9 h-9 border-2 flex items-center justify-center transition-colors duration-200
              ${
                isRage
                  ? "border-[#ff3333] text-[#ff3333]"
                  : "border-[#666] text-[#888]"
              }`}
            >
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div
              className={`w-9 h-9 border-2 flex items-center justify-center transition-colors duration-200
              ${
                isRage
                  ? "bg-[#ff3333] text-black border-[#ff3333]"
                  : "bg-[#d4d4d4] text-black border-[#d4d4d4]"
              }`}
            >
              {isRage ? (
                <Flame className="w-4 h-4 animate-pulse" />
              ) : (
                <Ghost className="w-4 h-4" />
              )}
            </div>
          )}
        </div>

        {/* Message Bubble Brutalist */}
        <div
          className={`relative px-4 py-3 md:px-5 md:py-4 border-2 font-mono text-sm md:text-base transition-[border-color,background-color,color] duration-200
          ${
            isUser
              ? isRage
                ? "border-[#ff3333]/60 bg-[#1f0606] text-[#ff6666]"
                : "border-[#444] bg-[#141414] text-[#d4d4d4]"
              : isRage
                ? "border-[#ff3333] bg-[#220606] text-[#ff4d4d] shadow-[4px_4px_0px_#ff3333]"
                : "border-[#d4d4d4] bg-[#d4d4d4] text-[#0f0f0f] shadow-[4px_4px_0px_#555]"
          } 
        `}
        >
          <div
            className={`absolute -top-3 left-4 px-2 uppercase tracking-widest text-[10px] font-bold select-none
            ${
              isUser
                ? isRage
                  ? "bg-[#1f0606] text-[#ff3333] border border-[#ff3333]/40"
                  : "bg-[#141414] text-[#888] border border-[#444]"
                : isRage
                  ? "bg-[#220606] text-[#ff3333] border border-[#ff3333]"
                  : "bg-[#d4d4d4] text-[#0f0f0f] border border-[#0f0f0f]"
            }`}
          >
            {isUser ? "YOU" : "DR. BLANE"}
          </div>

          <div className="leading-relaxed wrap-break-word">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => (
                  <p className="mb-3 last:mb-0" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />
                ),
                li: ({ ...props }) => <li {...props} />,
                h1: ({ ...props }) => (
                  <h1
                    className="text-base md:text-lg font-black mb-3 uppercase tracking-wider"
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    className="text-sm md:text-base font-bold mb-2 uppercase tracking-wide"
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    className="text-xs md:text-sm font-bold mb-1.5 uppercase"
                    {...props}
                  />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-extrabold" {...props} />
                ),
                code: ({
                  inline,
                  className,
                  children,
                  ...props
                }: CodeBlockProps) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <div className="my-3 border-2 border-inherit bg-black/10">
                      {match && (
                        <div className="px-2 py-0.5 text-[10px] uppercase font-black border-b-2 border-inherit opacity-70">
                          {match[1]}
                        </div>
                      )}
                      <pre className="p-2.5 overflow-x-auto text-xs leading-tight">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-black/15 px-1 py-0.5 mx-0.5 rounded-none text-xs font-bold border border-current"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>

            {isStreaming && (
              <span
                className={`inline-block w-2.5 h-4 ml-1 align-middle animate-pulse ${
                  isRage ? "bg-[#ff3333]" : "bg-[#0f0f0f]"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
