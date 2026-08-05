'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const elements = parseSimpleMarkdown(content);
  return <div className={`space-y-2 leading-relaxed ${className}`}>{elements}</div>;
}

function parseSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-2 list-disc space-y-1 pl-5">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      nodes.push(
        <h3 key={i} className="mt-3 text-base font-semibold text-ink">
          {renderInlineFormatting(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(
        <h2 key={i} className="mt-4 font-display text-lg font-bold text-ink">
          {renderInlineFormatting(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      nodes.push(
        <h1 key={i} className="mt-4 font-display text-xl font-bold text-ink">
          {renderInlineFormatting(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(<li key={i}>{renderInlineFormatting(trimmed.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      const content = trimmed.replace(/^\d+\.\s/, '');
      nodes.push(
        <div key={i} className="my-1 flex gap-2 pl-2">
          <span className="font-semibold text-track">{trimmed.match(/^\d+\./)?.[0]}</span>
          <span>{renderInlineFormatting(content)}</span>
        </div>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList();
      nodes.push(
        <blockquote key={i} className="my-2 border-l-4 border-track pl-3 italic text-ink-soft">
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
    } else {
      flushList();
      nodes.push(<p key={i}>{renderInlineFormatting(line)}</p>);
    }
  }

  flushList();
  return nodes;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`(.*?)`/);

    let firstMatch: { type: 'bold' | 'code'; index: number; length: number; content: string } | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      firstMatch = { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, content: boldMatch[1] };
    }

    if (codeMatch && codeMatch.index !== undefined) {
      if (!firstMatch || codeMatch.index < firstMatch.index) {
        firstMatch = { type: 'code', index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[1] };
      }
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (firstMatch.type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-ink font-bold">
          {firstMatch.content}
        </strong>
      );
    } else if (firstMatch.type === 'code') {
      parts.push(
        <code key={key++} className="rounded bg-surface px-1.5 py-0.5 font-stat text-xs text-track">
          {firstMatch.content}
        </code>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch.length);
  }

  return parts;
}
