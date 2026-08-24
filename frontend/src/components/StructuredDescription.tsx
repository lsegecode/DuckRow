/**
 * StructuredDescription — parses formatted markdown sections into distinct cards,
 * and renders Markdown formatting (bold, lists, code, links) within section bodies.
 */

import { useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface StructuredDescriptionProps {
  description?: string;
}

interface Section {
  header: string;
  body: string;
}

export default function StructuredDescription({ description = '' }: StructuredDescriptionProps) {
  const sections = useMemo(() => {
    if (!description.trim()) return [];

    const lines = description.split('\n');
    const parsed: Section[] = [];
    let currentHeader = '';
    let currentBodyLines: string[] = [];

    for (const line of lines) {
      if (/^#{1,6}\s+/.test(line)) {
        if (currentHeader || currentBodyLines.length > 0) {
          parsed.push({
            header: currentHeader,
            body: currentBodyLines.join('\n').trim(),
          });
        }
        currentHeader = line.replace(/^#{1,6}\s+/, '').trim();
        currentBodyLines = [];
      } else {
        currentBodyLines.push(line);
      }
    }

    if (currentHeader || currentBodyLines.length > 0) {
      parsed.push({
        header: currentHeader,
        body: currentBodyLines.join('\n').trim(),
      });
    }

    return parsed.filter((s) => s.header || s.body);
  }, [description]);

  if (sections.length === 0) {
    return (
      <div className="bg-obsidian/30 p-5 rounded-xl border border-border/50 text-text-muted italic text-sm">
        No description provided.
      </div>
    );
  }

  // If there's only 1 unstructured block without headers
  if (sections.length === 1 && !sections[0].header) {
    return (
      <div className="bg-obsidian/30 p-5 rounded-xl border border-border/50 text-text-primary text-sm leading-relaxed">
        <MarkdownRenderer content={sections[0].body} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((sec, idx) => {
        const style = getSectionStyle(sec.header);

        return (
          <div
            key={idx}
            className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all duration-[var(--transition-fast)]`}
          >
            {sec.header && (
              <div className={`px-4 py-2.5 ${style.headerBg} border-b ${style.border} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{style.icon}</span>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${style.textColor}`}>
                    {cleanHeaderText(sec.header)}
                  </h4>
                </div>
              </div>
            )}
            <div className="p-4 text-text-primary text-sm leading-relaxed font-sans select-text">
              {sec.body ? (
                <MarkdownRenderer content={sec.body} />
              ) : (
                <span className="text-text-muted italic">N/A</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function cleanHeaderText(raw: string): string {
  // Removes leading emojis and markdown formatting symbols (*, _, `, #) from header titles
  let cleaned = raw.replace(/^[💡⚠️🔧🚀🎯🛠️❓📌📝\s]+/, '').trim();
  cleaned = cleaned.replace(/[\*_`#]+/g, '').trim();
  return cleaned || raw;
}

function getSectionStyle(header: string) {
  const lower = header.toLowerCase();

  if (lower.includes('expected') || lower.includes('esperado') || lower.includes('goal') || lower.includes('objetivo') || lower.includes('💡') || lower.includes('🚀')) {
    return {
      icon: lower.includes('goal') || lower.includes('objetivo') ? '🚀' : '💡',
      border: 'border-teal/30',
      bg: 'bg-teal/5',
      headerBg: 'bg-teal/15',
      textColor: 'text-teal-glow',
    };
  }

  if (lower.includes('actual') || lower.includes('real') || lower.includes('use case') || lower.includes('caso de uso') || lower.includes('⚠️') || lower.includes('🎯')) {
    return {
      icon: lower.includes('use case') || lower.includes('caso de uso') ? '🎯' : '⚠️',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      headerBg: 'bg-amber-500/15',
      textColor: 'text-amber-300',
    };
  }

  if (lower.includes('tried') || lower.includes('intenté') || lower.includes('details') || lower.includes('detalles') || lower.includes('🔧') || lower.includes('🛠️')) {
    return {
      icon: lower.includes('tried') || lower.includes('intenté') ? '🔧' : '🛠️',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/5',
      headerBg: 'bg-indigo-500/15',
      textColor: 'text-indigo-300',
    };
  }

  return {
    icon: '📝',
    border: 'border-border/60',
    bg: 'bg-obsidian/40',
    headerBg: 'bg-surface/50',
    textColor: 'text-text-secondary',
  };
}
