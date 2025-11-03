'use client';

import { AnnotationWithUser } from '@/lib/types/annotation';

interface HighlightedTextProps {
  text: string;
  annotations: AnnotationWithUser[];
  searchTerm?: string;
  selectedAnnotationId?: string | null;
  onHighlightClick: (annotationId: string) => void;
}

export default function HighlightedText({
  text,
  annotations,
  searchTerm = '',
  selectedAnnotationId,
  onHighlightClick
}: HighlightedTextProps) {
  
  // keep html safe from xss
  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));

  // treat search as literal text not regex
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // highlight search term but skip inside html tags
  const applySearchHighlight = (html: string, term: string) => {
    if (!term.trim()) {
      return html;
    }
    const pattern = new RegExp(`(${escapeRegex(term)})`, "gi");
    // grab text between tags only
    return html.replace(/([^>])([^<]*?)(?=<|$)/g, (m, after, txt) => {
      if (!txt) {
        return m;
      }
      return after + txt.replace(pattern, '<mark class="bg-blue-200">$1</mark>');
    });
  };

  const prepareHighlightedHtml = () => {
    const normalized = text
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n(?!\n)/g, " ")
      .replace(/\n\n/g, "<br/><br/>");

    // filter out comment annotations
    const highlights = annotations
      .filter(a => a.type === 'highlight' && a.selection_start !== null && a.selection_end !== null)
      .map(a => ({
        start: a.selection_start!,
        end: a.selection_end!,
        annotationId: a.id
      }))
      .sort((a, b) => a.start - b.start);

    if (highlights.length === 0) {
      return applySearchHighlight(escapeHtml(normalized), searchTerm);
    }

    let result = '';
    let currentIndex = 0;

    for (const highlight of highlights) {
      if (currentIndex < highlight.start) {
        result += escapeHtml(normalized.slice(currentIndex, highlight.start));
      }

      const highlightedText = normalized.slice(highlight.start, highlight.end);
      const isSelected = selectedAnnotationId === highlight.annotationId;
      const hasComments = annotations.some(a => a.parent_id === highlight.annotationId);
      
      const baseClasses = 'annotation-highlight cursor-pointer transition-all rounded-sm px-0.5';
      const stateClasses = isSelected ? 'bg-yellow-300 ring-2 ring-yellow-400' : 'bg-yellow-200/50 hover:bg-yellow-200/70';
      const commentClasses = hasComments ? 'border-b-2 border-yellow-600' : '';
      const classes = `${baseClasses} ${stateClasses} ${commentClasses}`.trim();

      result += `<mark class="${classes}" data-annotation-id="${highlight.annotationId}" onclick="window.handleHighlightClick('${highlight.annotationId}')">${escapeHtml(highlightedText)}</mark>`;
      
      currentIndex = highlight.end;
    }

    if (currentIndex < normalized.length) {
      result += escapeHtml(normalized.slice(currentIndex));
    }

    return applySearchHighlight(result, searchTerm);
  };

  if (typeof window !== 'undefined') {
    (window as { handleHighlightClick?: (id: string) => void }).handleHighlightClick = (annotationId: string) => {
      onHighlightClick(annotationId);
    };
  }

  return (
    <div
      className="document-text w-full whitespace-normal text-gray-900 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: prepareHighlightedHtml()
      }}
    />
  );
}

