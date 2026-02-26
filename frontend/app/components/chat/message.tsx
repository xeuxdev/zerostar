import { Flame, Ghost, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "./types";

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
      } group mb-4`}
    >
      <div
        className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar Area */}
        <div className="shrink-0 pt-2 hidden sm:block">
          {isUser ? (
            <div
              className={`w-10 h-10 border-2 flex items-center justify-center
              ${
                isRage
                  ? "border-[#ff3333] text-[#ff3333]/70"
                  : "border-[#d4d4d4] text-[#d4d4d4]/70"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 border-2 flex items-center justify-center
              ${
                isRage
                  ? "bg-[#ff3333] text-black border-[#ff3333]"
                  : "bg-[#d4d4d4] text-black border-[#d4d4d4]"
              }`}
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
          className={`relative px-4 py-3 md:px-6 md:py-4 border-2 
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
            className={`leading-relaxed wrap-break-word ${
              !isUser && "font-sans text-[0.95em]"
            }`}
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
              {msg.content + (isStreaming ? " █" : "")}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
