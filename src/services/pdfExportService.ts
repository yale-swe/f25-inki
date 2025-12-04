import jsPDF from 'jspdf';
import { Document } from '@/lib/types/document';
import { AnnotationWithUser } from '@/lib/types/annotation';
import { formatDateShort } from '@/lib/utils/helpers';
import {
  wrapText,
  addPageIfNeeded,
  cleanFilename,
} from '@/lib/utils/pdfHelpers';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const LINE_HEIGHT = 7;
const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export async function generateAnnotatedPDF(
  document: Document,
  annotations: AnnotationWithUser[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = MARGIN;

  yPosition = addHeader(pdf, document, annotations, yPosition);

  yPosition = addDocumentText(pdf, document, annotations, yPosition);

  addAnnotationsSection(pdf, annotations, yPosition);

  const filename = cleanFilename(document.title);
  pdf.save(filename);
}

function addHeader(
  pdf: jsPDF,
  document: Document,
  annotations: AnnotationWithUser[],
  yPosition: number
): number {
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');

  const docTitle = document.title ? document.title : 'Untitled Document';
  pdf.text(docTitle, MARGIN, yPosition);
  yPosition += LINE_HEIGHT * 1.5;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const annotationCount = annotations.filter(
    (a) => a.type === 'highlight'
  ).length;
  const headerInfo = `Exported: ${formatDateShort(new Date().toISOString())} • ${annotationCount} Annotations`;
  pdf.text(headerInfo, MARGIN, yPosition);
  yPosition += LINE_HEIGHT * 2;

  // separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition);
  yPosition += LINE_HEIGHT;

  return yPosition;
}

function addDocumentText(
  pdf: jsPDF,
  document: Document,
  annotations: AnnotationWithUser[],
  yPosition: number
): number {
  if (!document.raw_text) {
    return yPosition;
  }

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const text = document.raw_text;
  const highlights = annotations
    .filter(
      (a) =>
        a.type === 'highlight' &&
        a.selection_start !== null &&
        a.selection_end !== null
    )
    .map((a) => ({
      start: a.selection_start!,
      end: a.selection_end!,
      id: a.id,
    }))
    .sort((a, b) => a.start - b.start);

  // split into words, render highlights
  const words = text.split(/(\s+)/);
  let currentPosition = 0;
  let currentX = MARGIN;

  for (const word of words) {
    const wordStart = currentPosition;
    const wordEnd = currentPosition + word.length;

    // check if word overlaps highlights
    const activeHighlights = highlights.filter(
      (h) => h.start < wordEnd && h.end > wordStart
    );

    const wordWidth = pdf.getTextWidth(word);

    // wrap if doesn't fit
    if (currentX + wordWidth > PAGE_WIDTH - MARGIN && word.trim()) {
      yPosition += LINE_HEIGHT;
      currentX = MARGIN;
      yPosition = addPageIfNeeded(
        pdf,
        yPosition,
        LINE_HEIGHT * 2,
        MARGIN,
        PAGE_HEIGHT
      );
    }

    if (activeHighlights.length > 0) {
      pdf.setFillColor(255, 255, 200);
      pdf.rect(currentX, yPosition - 5, wordWidth, LINE_HEIGHT, 'F');
    }

    pdf.text(word, currentX, yPosition);
    currentX += wordWidth;
    currentPosition = wordEnd;
  }

  yPosition += LINE_HEIGHT * 2;

  return yPosition;
}

function addAnnotationsSection(
  pdf: jsPDF,
  annotations: AnnotationWithUser[],
  yPosition: number
) {
  const highlights = annotations.filter((a) => a.type === 'highlight');

  if (highlights.length === 0) {
    return;
  }

  yPosition = addPageIfNeeded(
    pdf,
    yPosition,
    LINE_HEIGHT * 4,
    MARGIN,
    PAGE_HEIGHT
  );

  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition);
  yPosition += LINE_HEIGHT;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANNOTATIONS', MARGIN, yPosition);
  yPosition += LINE_HEIGHT * 1.5;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  for (const highlight of highlights) {
    yPosition = addPageIfNeeded(
      pdf,
      yPosition,
      LINE_HEIGHT * 3,
      MARGIN,
      PAGE_HEIGHT
    );

    let highlightText;
    if (highlight.selection_text) {
      highlightText = highlight.selection_text;
    } else {
      highlightText = '';
    }

    if (highlightText) {
      pdf.setFont('helvetica', 'italic');
      const quotedText = `"${highlightText}"`;
      const wrappedQuote = wrapText(pdf, quotedText, MAX_WIDTH);

      for (const line of wrappedQuote) {
        yPosition = addPageIfNeeded(
          pdf,
          yPosition,
          LINE_HEIGHT,
          MARGIN,
          PAGE_HEIGHT
        );
        pdf.text(line, MARGIN, yPosition);
        yPosition += LINE_HEIGHT;
      }
    }

    // get all comments
    const allCommentsInThread = annotations.filter(
      (a) => a.type === 'comment' && isCommentInThread(a, highlight.id, annotations)
    );

    for (const comment of allCommentsInThread) {
      let userName;
      if (comment.user.full_name) {
        userName = comment.user.full_name;
      } else {
        userName = comment.user.username;
      }

      const timestamp = formatDateShort(comment.created_at);

      let commentText;
      if (comment.content) {
        commentText = comment.content;
      } else {
        commentText = '';
      }

      const commentHeader = `• ${userName} (${timestamp}): ${commentText}`;
      const wrappedComment = wrapText(pdf, commentHeader, MAX_WIDTH);

      pdf.setFont('helvetica', 'normal');

      for (const line of wrappedComment) {
        yPosition = addPageIfNeeded(
          pdf,
          yPosition,
          LINE_HEIGHT,
          MARGIN,
          PAGE_HEIGHT
        );
        pdf.text(line, MARGIN, yPosition);
        yPosition += LINE_HEIGHT;
      }
    }

    yPosition += LINE_HEIGHT * 0.5;
  }
}

function isCommentInThread(
  comment: AnnotationWithUser,
  highlightId: string,
  allAnnotations: AnnotationWithUser[]
): boolean {
  let currentId = comment.parent_id;

  while (currentId) {
    if (currentId === highlightId) {
      return true;
    }

    const parent = allAnnotations.find((a) => a.id === currentId);
    if (!parent) {
      return false;
    }

    currentId = parent.parent_id;
  }

  return false;
}
