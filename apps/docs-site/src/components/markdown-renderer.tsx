"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import { cn } from "@/lib/cn";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={
          {
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-slate-900 underline underline-offset-4 hover:text-slate-700"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={
                  href?.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {children}
              </a>
            ),
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const inline = !match;

              if (!inline && match) {
                return (
                  <SyntaxHighlighter
                    // @ts-expect-error style typing mismatch
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              }

              return (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-slate-800">{children}</td>
            ),
          } as Partial<Components>
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
