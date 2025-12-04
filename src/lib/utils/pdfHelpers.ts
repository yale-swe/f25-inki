import jsPDF from 'jspdf';

export function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let selectedLine = '';

  for (const word of words) {
    // try adding this word to the current line
    let proposedLine;
    if (selectedLine) {
      proposedLine = `${selectedLine} ${word}`;
    } else {
      proposedLine = word;
    }

    const textWidth = pdf.getTextWidth(proposedLine);

    // if it doesn't fit start new line
    if (textWidth > maxWidth && selectedLine) {
      lines.push(selectedLine);
      selectedLine = word;
    } else {
      selectedLine = proposedLine;
    }
  }

  if (selectedLine) {
    lines.push(selectedLine);
  }

  return lines;
}

export function addPageIfNeeded(
  pdf: jsPDF,
  currentY: number,
  requiredSpace: number,
  margin: number,
  pageHeight: number
): number {
  if (currentY + requiredSpace > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return currentY;
}

export function cleanFilename(title: string | null): string {
  if (!title) {
    return 'Document_annotated.pdf';
  }

  const cleaned = title
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);

  if (cleaned) {
    return `${cleaned}_annotated.pdf`;
  } else {
    return 'Document_annotated.pdf';
  }
}
