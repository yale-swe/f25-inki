"use client";

import { useState, useEffect, useCallback } from "react";

interface AnnotationToolbarProps {
  canCreate: boolean;
  onCreateHighlight: (selection: {
    start: number;
    end: number;
    text: string;
  }) => void;
}

interface SelectionInfo {
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
}

export default function AnnotationToolbar({
  canCreate,
  onCreateHighlight,
}: AnnotationToolbarProps) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCancel = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isCreating) {
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const selectedText = sel.toString().trim();

      if (!selectedText) {
        setSelection(null);
        return;
      }

      const container = range.commonAncestorContainer;
      const parentElement =
        container.nodeType === Node.TEXT_NODE
          ? (container.parentElement as HTMLElement)
          : (container as HTMLElement);

      // make sure we're selecting inside document text
      let isInDocumentText = false;
      let current: HTMLElement | null = parentElement;
      while (current) {
        if (current.classList?.contains("document-text")) {
          isInDocumentText = true;
          break;
        }
        current = current.parentElement;
      }

      if (!isInDocumentText) {
        setSelection(null);
        return;
      }

      // position toolbar near selected text
      const rects = range.getBoundingClientRect();

      const documentText = document.querySelector(".document-text");
      if (!documentText) {
        setSelection(null);
        return;
      }

      // calculate character offsets for storing in db
      const beforeText = getTextBeforeSelection(documentText, range);
      const start = beforeText.length;
      const end = start + selectedText.length;

      const toolbarHeight = 48;
      const spaceBelow = window.innerHeight - rects.bottom;
      const spaceAbove = rects.top;
      const margin = 8;

      let x = rects.left + rects.width / 2;
      let y: number;

      // try to position below otherwise go above
      if (spaceBelow >= toolbarHeight + margin) {
        y = rects.bottom + margin;
      } else if (spaceAbove >= toolbarHeight + margin) {
        y = rects.top - toolbarHeight - margin;
      } else {
        y = rects.bottom + margin;
      }

      const toolbarWidth = 150;
      const minX = toolbarWidth / 2 + 16;
      const maxX = window.innerWidth - toolbarWidth / 2 - 16;
      x = Math.max(minX, Math.min(maxX, x));

      setSelection({
        text: selectedText,
        start,
        end,
        x,
        y,
      });
    };

    // start of container to selection start to get offset
    const getTextBeforeSelection = (
      container: Element,
      range: Range
    ): string => {
      const preRange = document.createRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.startContainer, range.startOffset);
      return preRange.toString();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, [isCreating]);

  // esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selection) {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection, handleCancel]);

  const handleCreateHighlight = async () => {
    if (!selection) {
      return;
    }

    try {
      setIsCreating(true);
      await onCreateHighlight({
        start: selection.start,
        end: selection.end,
        text: selection.text,
      });

      window.getSelection()?.removeAllRanges();
      setSelection(null);
    } catch (error) {
      console.error("Failed to create highlight:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!canCreate || !selection) {
    return null;
  }

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex items-center gap-1 p-1.5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={handleCreateHighlight}
          disabled={isCreating}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          {isCreating ? "Creating..." : "Highlight"}
        </button>
        <button
          onClick={handleCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="Cancel (Esc)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
