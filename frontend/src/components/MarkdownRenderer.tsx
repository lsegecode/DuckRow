/**
 * MarkdownRenderer — renders Markdown text into formatted React HTML elements.
 * Supports GFM (tables, task lists, strikethrough), code blocks, bold, italic, links, etc.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

export default function MarkdownRenderer({ content = '', className = '' }: MarkdownRendererProps) {
  if (!content || !content.trim()) return null;

  return (
    <div className={`markdown-content text-text-primary text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-text-primary mt-3 mb-2 border-b border-border/40 pb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-text-primary mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-text-primary mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last.mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-2 text-text-secondary">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2 text-text-secondary">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-text-primary">{children}</li>,
          code: ({ inline, className, children }: any) => {
            if (inline || !className) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-surface/80 text-teal-glow text-xs font-mono border border-border/50">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 rounded-xl bg-obsidian border border-border/60 text-xs font-mono overflow-x-auto text-teal-glow">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-teal/50 pl-3 py-1 my-2 italic text-text-secondary bg-teal/5 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border/50" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-glow underline hover:text-teal transition-colors">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs text-left border-collapse border border-border/50 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface/70 text-text-primary uppercase tracking-wider">{children}</thead>,
          th: ({ children }) => <th className="p-2 border border-border/50 font-bold">{children}</th>,
          td: ({ children }) => <td className="p-2 border border-border/40">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
